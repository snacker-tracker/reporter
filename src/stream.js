import AWS from 'aws-sdk'
import uuid from 'uuid'
import config from './config/'
import axios from 'axios'

import express from 'express'
const server = express()

import prom from 'prom-client'

const register = prom.register
server.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

server.listen(3000);


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


//AWS.config.logger = console

console.log(config.kinesis)

let kinesis = new AWS.Kinesis(config.kinesis)

class EventHandlerOne {
  async run(record) {
    console.log(this.constructor.name, record)

    return "one"
  }
}

class EventHandlerTwo {
  async run(record) {
    console.log(this.constructor.name, record)

    throw new Error("asdad")
    return "two"
  }
}

const eventHandlerMapping = {
  ScanCreated: [EventHandlerOne, EventHandlerTwo],
}

class KinesisConsumer {
  constructor(client, streamName, refreshRate = 1000) {
    this.client = client
    this.streamName = streamName
    this.refreshRate = refreshRate
    this._getRecords = this._getRecords.bind(this)
  }

  _getRecords = async function () {
    const newRecords = await this.client.getRecords({
      ShardIterator: this.iterator,
      Limit: 100
    }).promise()

    if(newRecords.Records.length > 0) {
      newRecords.Records.forEach(async (r) => {
        //console.log(r.Data.toString())
        await this.process(JSON.parse(r.Data.toString()))
      })
    }

    this.iterator = newRecords.NextShardIterator
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
  }

  records(recordCount = 100) {
    return this.records.shift(recordCount)
  }

  async process(record) {
    return
  }
}


// curl -v "https://www.bigc.co.th/sb.php?q=${UPC}&storeid=1&currencycode=THB" -H 'X-Requested-With: XMLHttpRequest'  | jq .response


class MyConsumer extends KinesisConsumer {

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
    console.log(record.event, record.version, JSON.stringify(record.payload))

    events_seen.labels(record.event).inc()

    switch(record.event) {
      case 'ScanCreated':
        const local = await this.check_local(record.payload.code)

        if(local) {
          console.log('got code', local)
          return
        }

        if(!code.match(/^[0-9]+$/)) {
          console.log("Doesnt look like a UPC")
          return
        }

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

let C = new MyConsumer(kinesis, config.kinesis.stream_name)
C.start()
