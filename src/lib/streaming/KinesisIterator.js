class KinesisIterator {
  constructor(client, stream, type, config) {
    this.client = client
    this.stream = stream
    this.type = type
    this.config = {
      pollingDelay: 10000,
      limit: 10,
      ...config
    }
    this.shardIterators = {} // Map<shardId, shardIterator>
  }

  async * shards() {
    const shards = await this.client.listShards({
      StreamName: this.stream
    }).promise()

    const shardIds = shards.Shards.map( (shard) => {
      return shard.ShardId
    })

    for(const shard of shardIds) {
      yield shard
    }
  }

  async sleep(milliseconds) {
    await new Promise( (resolve) => {
      setTimeout(() => { resolve(true) }, milliseconds )
    })
  }

  async * iterators(shardId) {
    const iterator = await this.client.getShardIterator({
      StreamName: this.stream,
      ShardIteratorType: this.type,
      ShardId: shardId
    }).promise()

    // yield the first iterator
    yield iterator.ShardIterator

    // then we update the iterator from records()
    while(true) {
      yield this.shardIterators[shardId]
    }
  }

  async _records(iterator, limit) {
    const records = await this.client.getRecords({
      ShardIterator: iterator,
      Limit: limit,
    }).promise()

    return records
  }

  async * records() {
    for await (const shardId of this.shards()) {
      let lastSeenSequenceNumber
      for await ( const iterator of this.iterators(shardId) ) {
        try {
          const {
            Records,
            NextShardIterator
          } = await this._records(iterator, this.config.limit)


          for(const record of Records) {
            lastSeenSequenceNumber = record.SequenceNumber
            yield record
          }

          // we should use this the next time
          this.shardIterators[shardId] = NextShardIterator

          // dont sleep if it looks like we're still going through backlog
          if(Records.length < this.config.limit) {
            await this.sleep(this.config.pollingDelay)
          }
        } catch(error) {
          if(error.constructor.name === 'ExpiredIteratorException') {
            await this.resetIteratorToLastSeenSequenceNumber(
              this.stream, shardId, lastSeenSequenceNumber
            )
          } else {
            throw error
          }
        }
      }
    }
  }

  async resetIteratorToLastSeenSequenceNumber(
    stream, shardId, lastSeenSequenceNumber) {
    const iterator =  await this.client.getShardIterator({
      StreamName: stream,
      ShardIteratorType: 'AFTER_SEQUENCE_NUMBER',
      ShardId: shardId,
      StartingSequenceNumber: lastSeenSequenceNumber
    }).promise()
    this.shardIterators[shardId] = iterator.ShardIterator
  }
}

export default KinesisIterator
