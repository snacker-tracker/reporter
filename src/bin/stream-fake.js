import prom from 'prom-client'
import uuid from 'uuid'

import config from '../config/'
import logger from '../lib/logger'
import metrics from '../lib/metrics/Metrics'
import { TimeSpentProxy } from '../lib/metrics/Proxies'

import KinesisConsumer from '../lib/streaming/KinesisConsumer'
import InfoStores from '../lib/ProductInfoStores'
import PopulateProductDataFromInternet from '../handlers/stream/PopulateProductDataFromInternet'

const register = prom.register
register.registerMetric(metrics.product_info_store_time_spent)

config.reporter_base_url = 'https://reporter.snacker-tracker.qa.k8s.fscker.org/v1'

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

  const bigc = new InfoStores.BigCInfoStore()
  const upcdb = new InfoStores.UPCItemDBInfoStore()
  const off = new InfoStores.OpenFoodFactsInfoStore()
  const snacker = new InfoStores.SnackerTrackerInfoStore(config.reporter_base_url)
  const tops = new InfoStores.TopsCoThInfoStore()

  return {
    logger: log,
    productInfoStores: {
      bigc: new TimeSpentProxy(bigc, metrics.product_info_store_time_spent),
      upcdb: new TimeSpentProxy(upcdb, metrics.product_info_store_time_spent),
      off: new TimeSpentProxy(off, metrics.product_info_store_time_spent),
      snacker: new TimeSpentProxy(snacker, metrics.product_info_store_time_spent),
      tops: new TimeSpentProxy(tops, metrics.product_info_store_time_spent)
    }
  }
}

class KinesisIteratorFake {
  constructor() {
    this._records = []
  }

  setRecords(records) {
    this._records = records.map( (record) => {
      return {
        Data: JSON.stringify(record)
      }
    })
  }

  async * records() {
    for(const record of this._records) {
      yield record
    }
  }
}


let codes = [
  '6901668054401',
  '8850096848510',
  '753854110004',
  '8858672700023',
  '95506500',
  '8857107232030',
]

const records = codes.map( code => {
  return {
    id: uuid(),
    event: 'ScanCreated',
    payload: {
      code
    }
  }
})

const fakeIterator = new KinesisIteratorFake()
fakeIterator.setRecords(records)

const log = new logger.constructor()
log.setContext('component', 'KinesisConsumer')

let consumer = new KinesisConsumer(fakeIterator, { logger })

consumer.setHandlers(eventHandlerMapping)
consumer.setHandlerDependencies(dependencies)
consumer.start()
