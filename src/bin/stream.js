import config from '../config/'

import stream from '../services/stream'
import streamhandler from '../services/streamhandlers'

import express from 'express'
const server = express()


import KinesisIterator from '../lib/streaming/KinesisIterator'
import KinesisConsumer from '../lib/streaming/KinesisConsumer'

import PopulateProductDataFromInternet from '../handlers/stream/PopulateProductDataFromInternet'

const streamDependencies = stream(config, {})()

const streamHandlersDependencyProvider = streamhandler(config, {
  prometheus: streamDependencies.prometheus,
  logger: streamDependencies.logger
})

server.get('/metrics', (req, res) => {
  res.set('Content-Type', streamDependencies.prometheus.register.contentType)
  res.end(streamDependencies.prometheus.register.metrics())
})

server.listen(config.port)

let iterator = new KinesisIterator(
  streamDependencies.kinesis,
  streamDependencies.config.kinesis.stream_name,
  streamDependencies.config.kinesis.iterator_type,
  streamDependencies.config.kinesis,
  {
    logger: (() => {
      const logger = new streamDependencies.logger.constructor()
      logger.setContext('component', 'kinesis-iterator')

      return logger
    })()
  }
)

const eventHandlerMapping = {
  ScanCreated: [
    PopulateProductDataFromInternet
  ]
}

let consumer = new KinesisConsumer(iterator, { logger: streamDependencies.logger })

consumer.setHandlers(eventHandlerMapping)
consumer.setHandlerDependencies(streamHandlersDependencyProvider)
consumer.start()
