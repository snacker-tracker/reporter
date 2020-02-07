import KinesisIterator from './KinesisIterator'

const awsMock = () => {
  const fn = jest.fn()
  //const oldMockResolvedValue = fn.mockResolvedValue
  //const oldMockRejectedValue = fn.mockRejectedValue

  const mockResolvedValue = function(result) {
    fn.mockReturnValue({
      promise() {
        return Promise.resolve(result)
      }
    })
  }

  const mockRejectedValue = function(result) {
    fn.mockReturnValue({
      promise() {
        return Promise.reject(result)
      }
    })
  }

  fn.awsResolve = mockResolvedValue
  fn.awsReject = mockRejectedValue

  return fn
}

describe(KinesisIterator, () => {
  let KI
  let kinesis
  beforeEach( () => {
    kinesis = {
    }

    kinesis.listShards = awsMock()
    kinesis.listShards.awsResolve({
      Shards: [ { ShardId: 'shard-00000001' } ]
    })

    kinesis.getShardIterator = awsMock()
    kinesis.getShardIterator.awsResolve({
      ShardIterator: 'xxxyyyzzz'
    })

    kinesis.getRecords = awsMock()
    kinesis.getRecords.awsResolve({
      Records: [
        {
          'Data': 'abcabcabcabc'
        }
      ]
    })

    KI = new KinesisIterator(kinesis, 'example-stream', 'LATEST', {})
  })

  describe('* records()', () => {
    describe('behaviour', () => {
      it('returns an async generator', async () => {
        const next = await KI.records()
        expect(next.constructor.name).toBe('AsyncGenerator')
      })

      it('has a next() method', async () => {
        const next = await KI.records()
        expect(typeof(next.next)).toBe('function')
      })

      it('returns a promise for a record when next() is called', async () => {
        const next = await KI.records()
        const recordPromise = next.next()

        expect(recordPromise.constructor.name).toBe('Promise')
      })

      it('returns a record when awaited', async () => {
        const next = await KI.records()
        const record = await next.next()

        expect(record).toMatchObject({
          done: false,
          value: {
            'Data': 'abcabcabcabc'
          }
        })
      })
    })

    describe('implementation details', () => {
      it('calls listShards of the right stream', async () => {
        const next = await KI.records()
        const record = await next.next()

        expect(kinesis.listShards).toHaveBeenCalledWith(
          expect.objectContaining({
            StreamName: 'example-stream'
          })
        )
      })

      it('calls getShardIterator on the right stream and shard', async () => {
        const next = await KI.records()
        const record = await next.next()

        expect(kinesis.getShardIterator).toHaveBeenCalledWith(
          expect.objectContaining({
            StreamName: 'example-stream',
            ShardId: 'shard-00000001',
            ShardIteratorType: 'LATEST'
          })
        )
      })

      it('calls getRecords with the right shard iterator', async () => {
        const next = await KI.records()
        const record = await next.next()

        expect(kinesis.getRecords).toHaveBeenCalledWith(
          expect.objectContaining({
            ShardIterator: 'xxxyyyzzz'
          })
        )
      })
    })
  })
})
