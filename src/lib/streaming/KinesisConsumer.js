import prom from 'prom-client'

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
  constructor(iterator, options = {}) {
    this.services = {
      logger: options.logger
    }
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
        this.services.logger.error({
          'msg': 'failed to parse JSON',
          'data': record.Data.toString()
        })
        continue
      }

      await this.process(data)
    }
  }

  async measure_time_spent(handler, event) {
    const start = new Date()

    const response = await handler.run(event)

    handlers_time_spent
      .labels(event.event, handler.constructor.name, true)
      .observe((new Date() - start) / 1000)

    handlers_triggered
      .labels(event.event, handler.constructor.name, true)
      .inc()

    return response
  }

  instantiate_dependencies(event, handler_class) {
    return ( typeof(this.handlerDependencies) === 'function' ) ?
      this.handlerDependencies(event, handler_class) : this.handlerDependencies
  }

  async process(event) {
    events_seen.labels(event.event).inc()

    const logger = new this.services.logger.constructor(this.services.logger.instance)

    logger.setContext('event', event.event)
    logger.setContext('event_id', event.id)

    if(!this.handlers[event.event]) {
      logger.info('event has no handler')
      return
    }

    const handler_instances = this.handlers[event.event].map( handler => {
      const dependencies = this.instantiate_dependencies(event, handler)
      return new handler(dependencies)
    })

    const promises = handler_instances.map( async (handler) => {
      return [
        handler.constructor.name,
        await this.measure_time_spent(handler, event)
      ]
    })

    let results = await Promise.all(promises)

    for(const result of results) {
      logger.info({
        handler: Object.entries(result)[0][0],
        result: Object.entries(result)[0][1]
      })
    }

    return true
  }
}

export default KinesisConsumer
