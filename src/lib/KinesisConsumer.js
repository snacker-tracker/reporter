import prom from 'prom-client'
import logger from './logger'

const events_seen = new prom.Counter({
  name: 'stream_event_seen_count',
  help: 'number of stream events seen',
  labelNames: ['event'],
})

const handlers_triggered = new prom.Counter({
  name: 'stream_event_handler_triggered_count',
  help: 'number of handlers triggered',
  labelNames: ['event', 'handler', 'result']
})

const handlers_time_spent = new prom.Histogram({
  name: 'stream_event_handler_time_spent',
  help: 'time spent in various event handlers',
  labelNames: ['event', 'handler', 'result']
})

const sleep = async (delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve(true) }, delay)
  })
}

class KinesisIterator {
  constructor(client, stream, type, config) {
    this.client = client
    this.stream = stream
    this.type = type
    this.config = {
      pollingDelay: 10000,
      limit: 10,
      ...config
    }
    this.shardIterators = {} // Map<shardId, shardIterator>
  }

  async * shards() {
    const shards = await this.client.listShards({
      StreamName: this.stream
    }).promise()

    const shardIds = shards.Shards.map( (shard) => {
      return shard.ShardId
    })

    for(const shard of shardIds) {
      yield shard
    }
  }

  async sleep(milliseconds) {
    await new Promise( (resolve) => {
      setTimeout(() => { resolve(true) }, milliseconds )
    })
  }

  async * iterators(shardId) {
    const iterator = await this.client.getShardIterator({
      StreamName: this.stream,
      ShardIteratorType: this.type,
      ShardId: shardId
    }).promise()

    // yield the first iterator
    yield iterator.ShardIterator

    // then we update the iterator from records()
    while(true) {
      yield this.shardIterators[shardId]
    }
  }

  async _records(iterator, limit) {
    const records = await this.client.getRecords({
      ShardIterator: iterator,
      Limit: limit,
    }).promise()

    return records
  }

  async * records() {
    for await (const shardId of this.shards()) {
      for await ( const iterator of this.iterators(shardId) ) {
        const records = await this._records(iterator, this.config.limit)
        for(const record of records.Records) {
          yield record
        }

        // we should use this the next time
        this.shardIterators[shardId] = records.NextShardIterator

        // dont sleep if it looks like we're still going through backlog
        if(records.Records.length < this.config.limit) {
          await this.sleep(this.config.pollingDelay)
        }
      }
    }
  }
}

class KinesisConsumer {
  constructor(iterator, options = {}) {
    this.logger = options.logger
    this.iterator = iterator
    this.handlers = {}
  }

  setHandlers(handlers) {
    this.handlers = handlers
  }

  setHandlerDependencies(dependencies) {
    this.handlerDependencies = dependencies
  }

  async start() {
    for await (const record of this.iterator.records()) {
      let data
      try {
        data = JSON.parse(record.Data.toString())
      } catch( error ) {
        this.logger.error({ 'msg': 'failed to parse JSON', 'data': record.Data.toString() })
        continue
      }

      this.process(data)
    }
  }

  async process(event) {
    events_seen.labels(event.event).inc()

    const l = new logger.constructor(logger.instance)

    l.setContext('event', event.event)
    l.setContext('event_id', event.id)

    if(!this.handlers[event.event]) {
      l.info('event has no handler')
      return
    }

    const instances = this.handlers[event.event].map( handler => {
      let dependencies
      if(typeof(this.handlerDependencies) === 'function') {
        dependencies = this.handlerDependencies(event, handler)
      } else {
        dependencies = this.handlerDependencies
      }

      return new handler(dependencies)
    })

    let results = await Promise.all(
      instances.map( async (handler) => {
        const response = {}
        const start = new Date()

        response[handler.constructor.name] = await handler.run(event)

        handlers_triggered
          .labels(event.event, handler.constructor.name, true)
          .inc()

        handlers_time_spent
          .labels(event.event, handler.constructor.name, true)
          .observe((new Date() - start) / 1000)

        return response
      })
    )

    for(const result of results) {
      l.info({
        handler: Object.entries(result)[0][0],
        result: Object.entries(result)[0][1]
      })
    }

    return true
  }
}

export {
  KinesisConsumer,
  KinesisIterator
}
