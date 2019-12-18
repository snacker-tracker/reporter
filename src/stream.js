import AWS from 'aws-sdk'
import uuid from 'uuid'
import config from './config/'
import axios from 'axios'


import crypto from 'crypto'

import ImageRepository from './lib/ImageRepository'

import logger from './lib/logger'

import express from 'express'
const server = express()

import prom from 'prom-client'

import InfoStores from './lib/ProductInfoStores'

const register = prom.register
server.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

server.listen(config.port);

//import metrics from './lib/metrics'


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


/*
config.kinesis.endpoint = "https://kinesis.aws.k8s.fscker.org"
config.kinesis.stream_name = "snacker-tracker-prod"
config.reporter_base_url = "https://reporter.snacker-tracker.prod.k8s.fscker.org/v1"
*/

let kinesis = new AWS.Kinesis(config.kinesis)

class EventHandler {
  constructor(services) {
    this.services = services
  }

  run(event) {
    throw new Error("NotImplemented")
  }
}

class CodePictureCreatedHandler extends EventHandler{
  async run({id, event, timestamp, payload, version, actor}) {
    this.services.logger.info({event_handler: this.constructor.name, event, event_id: id, timestamp, version, payload, actor})

    return "one"
  }
}


class ScanCreatedHandler extends EventHandler{
  async run({id, event, timestamp, payload, version, actor}) {
    this.services.logger.info({event_handler: this.constructor.name, event, event_id: id, timestamp, version, payload, actor })

    const local = await this.services.productInfoStores.snacker.get(payload.code)
    const off = await this.services.productInfoStores.off.get(payload.code)

    const firstOf = (options, hash) => {
      for(const option of options) {
        if(hash[option] != undefined && hash[option] != "" && hash[options] != "unknown") {
          return hash[option]
        }
      }
    }


    if(off) {
      //console.log(JSON.stringify(Object.keys(off.product), null, 2))
      let p = off.product

      const data = {
        code: payload.code,
        name: firstOf(['product_name_en', 'generic_name_en', 'product_name', 'generic_name', 'product_name_th', 'generic_name_th'], off.product)
      }

      try {
        const postResponse = await this.services.productInfoStores.snacker.post(data)
        //console.log(postResponse)
      } catch (error) {
        //console.log(error)
      }

      console.log(p.image_url)

      if(p.image_url) {
        const img_response = await axios.get(p.image_url, {responseType: 'arraybuffer'})
        logger.info({headers: img_response.headers})

        const extension = img_response.headers['content-type'].split('/')[1]

        let hash = crypto.createHash('sha256').update(img_response.data).digest('hex')

        try {
          await this.services.productInfoStores.snacker.post_picture(payload.code, img_response.data)
          this.services.logger.info("Image uploaded")
        } catch(error) {
          console.log(error)
        }

      }
    }

    return true
  }
}

const eventHandlerMapping = {
  ScanCreated: [
    ScanCreatedHandler
  ],
  CodePictureCreated: [
    CodePictureCreatedHandler
  ]
}

class KinesisConsumer {
  constructor(client, streamName, refreshRate = 1000) {
    this.client = client
    this.streamName = streamName
    this.refreshRate = refreshRate
    this._getRecords = this._getRecords.bind(this)
    this.handlers = {}
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

  setHandlers(handlers) {
    this.handlers = handlers
  }

  async start() {
    let shards = await this.client.listShards({
      StreamName: this.streamName
    }).promise()

    let iterator = await this.client.getShardIterator({
      ShardId: shards.Shards[0].ShardId,
      ShardIteratorType: 'LATEST',
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
      l.info("event has no handler")
      return
    }

    const instances = this.handlers[event.event].map( handler => {
      const IR = new ImageRepository(new AWS.S3(config.s3), config.s3.bucket)

      const l = new logger.constructor(logger.instance)

      l.setContext('event', event.event)
      l.setContext('event_id', event.id)
      l.setContext('handler', handler.name)


      return new handler({
        logger: l,
        image_repository: IR,
        productInfoStores: {
          bigc: new InfoStores.BigCInfoStore(),
          upcdb: new InfoStores.UPCItemDBInfoStore(),
          off: new InfoStores.OpenFoodFactsInfoStore(),
          snacker: new InfoStores.SnackerTrackerInfoStore(config.reporter_base_url)
        }
      })
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

let C = new KinesisConsumer(kinesis, config.kinesis.stream_name)
C.setHandlers(eventHandlerMapping)
C.start()
