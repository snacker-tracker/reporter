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


class KinesisConsumer {
  constructor(client, streamName, options = {}) {
    options = {
      refreshRate: 1000,
      iteratorType: 'LATEST',
      ...options
    }

    this.client = client
    this.streamName = streamName
    this.refreshRate = options.refreshRate
    this._getRecords = this._getRecords.bind(this)
    this.logger = options.logger
    this.iteratorType = options.iteratorType
    this.handlers = {}
  }

  setHandlers(handlers) {
    this.handlers = handlers
  }

  setHandlerDependencies(dependencies) {
    this.handlerDependencies = dependencies
  }

  _getRecords = async function () {
    const newRecords = await this.client.getRecords({
      ShardIterator: this.iterator,
      Limit: 100
    }).promise()

    if(newRecords.Records.length > 0) {
      newRecords.Records.forEach(async (r) => {
        await this.process(JSON.parse(r.Data.toString()))
      })
    }

    this.iterator = newRecords.NextShardIterator
  }


  async start() {
    let shards = await this.client.listShards({
      StreamName: this.streamName
    }).promise()

    let iterator = await this.client.getShardIterator({
      ShardId: shards.Shards[0].ShardId,
      ShardIteratorType: this.iteratorType,
      StreamName: this.streamName
    }).promise()

    this.iterator = iterator.ShardIterator

    setInterval(this._getRecords, this.refreshRate)
    console.log('started streaming')
  }

  records(recordCount = 100) {
    return this.records.shift(recordCount)
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

export default KinesisConsumer
