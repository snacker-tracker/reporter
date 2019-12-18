import AWS from 'aws-sdk'
import uuid from 'uuid'
import config from './config/'
import axios from 'axios'

import logger from './lib/logger'

import express from 'express'
const server = express()

import prom from 'prom-client'

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
  async getCode(code) {
    try {
      const response = await axios.get(
        config.reporter_base_url + '/codes/' + code
      )

      return response.data
    } catch( error ) {
      return false
    }
  }

  async getFromOpenFoodFacts(code) {
    // https://world.openfoodfacts.org/api/v0/product/8850999220000.json
    try {
      const response = await axios.get(
        "https://world.openfoodfacts.org/api/v0/product/" + code + ".json"
      )

      return response.data
    } catch( error ) {
      return false
    }

  }

  async getFromUPCDB(code) {
    try {
      const response = await axios.get(
        'https://api.upcitemdb.com/prod/trial/lookup',
        {
          params: {
            upc: code
          }
        }
      )

      return response.data
    } catch(error) {
      return false
    }

  }


  async run({id, event, timestamp, payload, version, actor}) {
    this.services.logger.info({event_handler: this.constructor.name, event, event_id: id, timestamp, version, payload, actor })

    //const code_data = await this.getCode(payload.code)
    //this.services.logger.info({"msg":"code data", code_data})

    // $.product.image_front_url
    const off_data = await this.getFromOpenFoodFacts(payload.code)
    console.log(JSON.stringify(off_data, null, 2))
    //this.services.logger.info({"msg":"off data", off_data})
    if(off_data) {
      if(off_data.product) {
        if(off_data.product.image_url) {
          console.log(off_data.product.image_url)
        }
      }
    }

    //const upcdb_data = await this.getFromUPCDB(payload.code)



    return "one"
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
      return new handler({logger: l})
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

    results = results.reduce((a, c) => {
      a[Object.entries(c)[0][0]] = Object.entries(c)[0][1]
    }, {})

    l.info(results)

    return true
  }
}


// curl -v "https://www.bigc.co.th/sb.php?q=${UPC}&storeid=1&currencycode=THB" -H 'X-Requested-With: XMLHttpRequest'  | jq .response

class MyConsumerBloated extends KinesisConsumer {

  async check_local(code) {
    let local_code
    try {
      local_code = await axios.get(
        config.reporter_base_url + '/codes/' + code
      )

      console.log(JSON.stringify(local_code.data, null, 2))
      return local_code.data
    } catch(error) {
      console.log({
        message: 'read local ...',
        status: error.response.status,
        headers: error.response.headers
      })

      return false
    }
  }

  async read_upcitemdb(code) {
    let upc_search_result
    try {
      upc_search_result = await axios.get(
        'https://api.upcitemdb.com/prod/trial/lookup',
        {
          params: {
            upc: record.payload.code
          }
        }
      )

      console.log(JSON.stringify(upc_search_result.headers, null, 2))
      console.log(JSON.stringify(upc_search_result.data, null, 2))

    } catch(error) {
      console.log("Failed to query the UPC database")
      return false
    }

    if(upc_search_result.status != 200) {
      console.log("UPC returned non 200 (" + upc_search_result.status.toString() + ")")
      return false
    }

    if(upc_search_result.data.items == undefined) {
      console.log("Empty search results -- bailing")
      return false
    }

    if(upc_search_result.data.items.length < 1) {
      console.log("Empty search results -- bailing")
      return false
    }

    return upc_search_result.data.items[0]
  }

  async read_bigc(code) {
    let bigc_result
    try {
      bigc_result = await axios.get(
        'https://www.bigc.co.th/sb.php',
        {
          params: {
            q: code,
            storeid: 1,
            currencycode: 'THB'
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'User-agent': 'Mozilla Firefox'
          }
        }
      )

      if(bigc_result.data.response) {
        if(bigc_result.data.response.numFound > 0) {
          return bigc_result.data.response.docs[0]
        }
      }

      return false
    } catch(error) {
      console.log(error)
      console.log({
        message: 'read local ...',
        status: error.response.status,
        headers: error.response.headers
      })

      return false
    }

  }

  async write(item) {

  }

  async processNEW(record) {
    const handlers = eventHandlerMapping[record.event].map( async (handlerClass) => {
      let hc = new handlerClass()
      return hc.run()
    })

    let results
    try {
      results = await Promise.allSettled(handlers)
      console.log('asdaasd', results)
    } catch( error ) {
      console.log(error)
    }
  }

  async process(record) {
    console.log(record.event, record.version, JSON.stringify(record.actor), JSON.stringify(record.payload))
    // https://world.openfoodfacts.org/api/v0/product/8850999220000.json
    return

    events_seen.labels(record.event).inc()

    switch(record.event) {
      case 'ScanCreated':
        const local = await this.check_local(record.payload.code)

        if(local) {
          console.log('got code', local)
          return
        }

        if(!record.payload.code.match(/^[0-9]+$/)) {
          console.log("Doesnt look like a UPC")
          return
        }

        if(record.payload.code.length < 5 && record.payload.code.length > 16) {
          console.log("Doesnt look like a UPC")
          return
        }

        return

        let bigc = await this.read_bigc(record.payload.code)
        console.log('bigc result', bigc)

        let item
        if(bigc) {
          item = {
            name: bigc.name_varchar,
            url: bigc.url_path_varchar
          }
        } else {
          const upcitemdb = this.read_upcitemdb(record.payload.code)
          item = {
            name: item.title
          }
        }

        item.code = record.payload.code
        console.log('found', item)


        try {
          const write_response = await axios.post(
            config.reporter_base_url + '/codes/',
            item
          )

          console.log(write_response.data)
        } catch(error) {
          console.log(error.response.data)
        }

        return
        try {
  
        } catch(error) {
          if(error.response.status === 404) {
            console.log("Query the internet")

            let upc_search_result
            try {
              upc_search_result = await axios.get(
                'https://api.upcitemdb.com/prod/trial/lookup',
                {
                  params: {
                    upc: record.payload.code
                  }
                }
              )

              console.log(JSON.stringify(upc_search_result.headers, null, 2))
              console.log(JSON.stringify(upc_search_result.data, null, 2))
            } catch(error) {
              console.log("Failed to query the UPC database")
              return
            }

            if(upc_search_result.status != 200) {
              console.log("UPC returned non 200 (" + upc_search_result.status.toString() + ")")
              return
            }

            if(upc_search_result.data.items == undefined) {
              console.log("Empty search results -- bailing")
              return
            }

            if(upc_search_result.data.items.length < 1) {
              console.log("Empty search results -- bailing")
              return
            }

            const write_response = await axios.post(
              config.reporter_base_url + '/codes/',
              {
                code: record.payload.code,
                name: upc_search_result.data.items[0].title
              }
            )

            console.log(write_response.data)

          } else {
            console.log(error)
          }
        }

        return



        console.log({
          status: upc_search_result.status,
          headers: upc_search_result.headers
        })
        console.log(JSON.stringify(upc_search_result.data, null, 2))
        break

      default:
        console.log('doing nothing with this')
    }
  }
}

let C = new KinesisConsumer(kinesis, config.kinesis.stream_name)
C.setHandlers(eventHandlerMapping)
C.start()
