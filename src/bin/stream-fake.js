import prom from 'prom-client'
import uuid from 'uuid'

import axios from 'axios'

import config from '../config/'
import logger from '../services/logger'
import metrics from '../services/metrics'
import { TimeSpentProxy } from '../lib/metrics/Proxies'

import KinesisConsumer from '../lib/streaming/KinesisConsumer'
import KinesisIteratorFake from '../lib/streaming/KinesisIteratorFake'
import InfoStores from '../lib/ProductInfoStores'
import PopulateProductDataFromInternet from '../handlers/stream/PopulateProductDataFromInternet'

import TokenProvider from '../lib/TokenProvider'

const register = prom.register
register.registerMetric(metrics.other.product_info_store_time_spent)

config.reporter_base_url = 'https://reporter.snacker-tracker.qa.k8s.fscker.org/v1'

const eventHandlerMapping = {
  ScanCreated: [
    PopulateProductDataFromInternet
  ]
}

const tokenProvider = new TokenProvider(
  {
    issuer: 'https://' + config.oauth.issuer,
    client_id: config.oauth.client_id,
    client_secret: config.oauth.client_secret,
    audience: config.oauth.audience,
    endpoints: {
      token: '/oauth/token'
    }
  }, {
    axios
  }
)

const dependencies = (event, handler) => {
  log.setContext('event', event.event)
  log.setContext('event_id', event.id)
  log.setContext('handler', handler.name)

  const bigc = new InfoStores.BigCInfoStore()
  const upcdb = new InfoStores.UPCItemDBInfoStore()
  const off = new InfoStores.OpenFoodFactsInfoStore()
  const snacker = new InfoStores.SnackerTrackerInfoStore(config.reporter_base_url, {
    axios, tokenProvider
  })
  const tops = new InfoStores.TopsCoThInfoStore()

  return {
    logger: new logger.constructor(logger.instance),
    productInfoStores: {
      bigc: new TimeSpentProxy(bigc, metrics.other.product_info_store_time_spent),
      upcdb: new TimeSpentProxy(upcdb, metrics.other.product_info_store_time_spent),
      off: new TimeSpentProxy(off, metrics.other.product_info_store_time_spent),
      snacker: new TimeSpentProxy(snacker, metrics.other.product_info_store_time_spent),
      tops: new TimeSpentProxy(tops, metrics.other.product_info_store_time_spent)
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
