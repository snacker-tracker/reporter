import AWS from 'aws-sdk'
import uuid from 'uuid'
import config from './config/'

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
    switch(record.event) {
      default:
        console.log(record.event, record.version, JSON.stringify(record.payload))
        break
    }
  }
}

let C = new MyConsumer(kinesis, config.kinesis.stream_name)
C.start()
