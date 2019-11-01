import AWS from 'aws-sdk'
import uuid from 'uuid'
import config from './config/'
import axios from 'axios'

import metrics from './lib/metrics'

//AWS.config.logger = console

console.log(config.kinesis)

let kinesis = new AWS.Kinesis(config.kinesis)

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

class MyConsumer extends KinesisConsumer {
  async process(record) {
    console.log(record.event, record.version, JSON.stringify(record.payload))
    switch(record.event) {
      case 'ScanCreated':
        try {
          const local_code = await axios.get(
            config.reporter_base_url + '/codes/' + record.payload.code
          )
          console.log({
            status: local_code.status,
            headers: local_code.headers
          })
          console.log(JSON.stringify(local_code.data, null, 2))

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
            } catch(error) {
              console.log("Failed to query the UPC database")
              return
            }

            if(upc_search_result.status != 200) {
              console.log("UPC returned non 200 (" + upc_search_result.status.toString() + ")")
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
