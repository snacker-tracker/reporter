import InfoStores from './lib/ProductInfoStores'
import PopulateProductDataFromInternet from './eventHandlers/PopulateProductDataFromInternet'
import logger from './lib/logger'
import config from './config/'

import uuid from 'uuid'

config.reporter_base_url = 'https://reporter.snacker-tracker.qa.k8s.fscker.org/v1'

class KinesisConsumerFake {
  setRecords(records) {
    this.records = records
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
      //newRecords.Records.forEach(async (r) => {
    }

    this.iterator = newRecords.NextShardIterator
  }


  async start() {
    for( const r of this.records ) {
      r.id = uuid()
      const result = await this.process(r)
      console.log(result)
    }
  }

  async process(event) {
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

const eventHandlerMapping = {
  ScanCreated: [
    PopulateProductDataFromInternet
  ]
}

const dependencies = (event, handler) => {
  const log = new logger.constructor(logger.instance)

  log.setContext('event', event.event)
  log.setContext('event_id', event.id)
  log.setContext('handler', handler.name)

  return {
    logger: log,
    productInfoStores: {
      bigc: new InfoStores.BigCInfoStore(),
      upcdb: new InfoStores.UPCItemDBInfoStore(),
      off: new InfoStores.OpenFoodFactsInfoStore(),
      snacker: new InfoStores.SnackerTrackerInfoStore(config.reporter_base_url),
      tops: new InfoStores.TopsCoThInfoStore()
    }
  }
}


let consumer = new KinesisConsumerFake()

consumer.setRecords([
  {
    'event': 'ScanCreated',
    'payload': {
      'code': '8850999113005'
    }
  }
])

consumer.setHandlers(eventHandlerMapping)
consumer.setHandlerDependencies(dependencies)
consumer.start()
