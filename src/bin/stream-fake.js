import uuid from 'uuid'
import config from '../config/'

import stream from '../services/stream'
import streamhandler from '../services/streamhandlers'

import KinesisIteratorFake from '../lib/streaming/KinesisIteratorFake'
import KinesisConsumer from '../lib/streaming/KinesisConsumer'

import PopulateProductDataFromInternet from '../handlers/stream/PopulateProductDataFromInternet'

const streamDependencies = stream(config, {})()

const streamHandlersDependencyProvider = streamhandler(config, {
  prometheus: streamDependencies.prometheus,
  logger: streamDependencies.logger
})

const eventHandlerMapping = {
  ScanCreated: [
    PopulateProductDataFromInternet
  ]
}

let codes = [
/*
  '6901668054401',
  '8850096848510',
  '753854110004',
  '8858672700023',
  '95506500',
  */
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

const log = new streamDependencies.logger.constructor()
log.setContext('component', 'KinesisConsumer')

let consumer = new KinesisConsumer(fakeIterator, { logger: streamDependencies.logger })

consumer.setHandlers(eventHandlerMapping)
consumer.setHandlerDependencies(streamHandlersDependencyProvider)
consumer.start()
