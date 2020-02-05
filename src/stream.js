import AWS from 'aws-sdk'
import config from './config/'

import logger from './lib/logger'

import express from 'express'
const server = express()

import prom from 'prom-client'

import { KinesisConsumer, KinesisIterator } from './lib/KinesisConsumer'
import InfoStores from './lib/ProductInfoStores'
import PopulateProductDataFromInternet from './eventHandlers/PopulateProductDataFromInternet'

const register = prom.register
server.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
})

server.listen(config.port)

let kinesis = new AWS.Kinesis(config.kinesis)

let iterator = new KinesisIterator(kinesis, config.kinesis.stream_name, 'TRIM_HORIZON', config.kinesis)

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

let consumer = new KinesisConsumer(iterator, { logger: logger })

consumer.setHandlers(eventHandlerMapping)
consumer.setHandlerDependencies(dependencies)
consumer.start()
