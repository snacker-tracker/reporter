import AWS from 'aws-sdk'
import config from '../config/'

import logger from '../services/logger'

import express from 'express'
const server = express()

import prom from 'prom-client'
import metrics from '../services/metrics'
import { TimeSpentProxy } from '../lib/metrics/Proxies'

import KinesisIterator from '../lib/streaming/KinesisIterator'
import KinesisConsumer from '../lib/streaming/KinesisConsumer'

import InfoStores from '../lib/ProductInfoStores'
import PopulateProductDataFromInternet from '../handlers/stream/PopulateProductDataFromInternet'

const register = prom.register
server.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
})


register.registerMetric(metrics.other.product_info_store_time_spent)

server.listen(config.port)

config.kinesis = {
  ...config.kinesis,
  endpoint: 'https://kinesis.aws.k8s.fscker.org',
  stream_name: 'snacker-tracker-prod'
}

config.reporter_base_url = 'https://reporter.snacker-tracker.qa.k8s.fscker.org/v1'

let kinesis = new AWS.Kinesis(config.kinesis)

let iterator = new KinesisIterator(kinesis, config.kinesis.stream_name, 'TRIM_HORIZON', config.kinesis)


class Dumper {
  run(event) {
    console.log(event)
  }
}

const eventHandlerMapping = {
  ScanCreated: [
    PopulateProductDataFromInternet
    //Dumper
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
      bigc: new TimeSpentProxy(bigc, metrics.other.product_info_store_time_spent),
      upcdb: new TimeSpentProxy(upcdb, metrics.other.product_info_store_time_spent),
      off: new TimeSpentProxy(off, metrics.other.product_info_store_time_spent),
      snacker: new TimeSpentProxy(snacker, metrics.other.product_info_store_time_spent),
      tops: new TimeSpentProxy(tops, metrics.other.product_info_store_time_spent)
    }
  }
}

let consumer = new KinesisConsumer(iterator, { logger: logger })

consumer.setHandlers(eventHandlerMapping)
consumer.setHandlerDependencies(dependencies)
consumer.start()
