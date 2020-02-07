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
      for await ( const iterator of this.iterators(shardId) ) {
        const records = await this._records(iterator, this.config.limit)
        for(const record of records.Records) {
          yield record
        }

        // we should use this the next time
        this.shardIterators[shardId] = records.NextShardIterator

        // dont sleep if it looks like we're still going through backlog
        if(records.Records.length < this.config.limit) {
          await this.sleep(this.config.pollingDelay)
        }
      }
    }
  }
}

export default KinesisIterator
