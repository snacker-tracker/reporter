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

  const mockResolvedValueOnce = function(result) {
    fn.mockReturnValueOnce({
      promise() {
        return Promise.resolve(result)
      }
    })
  }

  const mockRejectedValueOnce = function(result) {
    fn.mockReturnValueOnce({
      promise() {
        return Promise.reject(result)
      }
    })
  }


  fn.awsResolve = mockResolvedValue
  fn.awsResolveOnce = mockResolvedValueOnce
  fn.awsReject = mockRejectedValue
  fn.awsRejectOnce = mockRejectedValueOnce

  return fn
}

describe(KinesisIterator, () => {
  let KI
  let kinesis
  let sleep

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
      NextShardIterator: 'next-shard-iterator',
      Records: [
        { 'Data': 'record one' },
        { 'Data': 'record two' }
      ]
    })

    KI = new KinesisIterator(kinesis, 'example-stream', 'LATEST', {})
    sleep = jest.spyOn(KI, 'sleep')
    sleep.mockResolvedValue(true)
  })

  describe('behaviour', () => {
    describe('Constructor', () => {
      it('uses the ShardIteratorType argument', async () => {
        KI = new KinesisIterator(kinesis, 'example-stream', 'BLAH', {})

        const next = await KI.records()
        await next.next()

        expect(kinesis.getShardIterator).toHaveBeenCalledWith(
          expect.objectContaining({
            StreamName: 'example-stream',
            ShardId: 'shard-00000001',
            ShardIteratorType: 'BLAH'
          })
        )
      })

      it('uses the stream name from the constructor', async () => {
        KI = new KinesisIterator(kinesis, 'another-stream', 'BLAH', {})

        const next = await KI.records()
        await next.next()

        expect(kinesis.listShards).toHaveBeenCalledWith(
          expect.objectContaining({
            StreamName: 'another-stream'
          })
        )
      })

      describe('options', () => {
        it('uses the limit option', async () => {
          KI = new KinesisIterator(kinesis, 'another-stream', 'BLAH', { limit: 'should-be-a-number' })

          const next = await KI.records()
          await next.next()

          expect(kinesis.getRecords).toHaveBeenCalledWith(
            expect.objectContaining({
              Limit: 'should-be-a-number'
            })
          )
        })

        it('uses the pollingDelay option', async () => {
          KI = new KinesisIterator(kinesis, 'example-stream', 'LATEST', { pollingDelay: 1 })
          sleep = jest.spyOn(KI, 'sleep')

          const next = await KI.records()
          await next.next()
          await next.next()

          await next.next()
          expect(KI.sleep).toHaveBeenCalledWith(1)
        })
      })
    })

    describe('* records()', () => {
      it('returns the first record of the batch', async () => {
        const next = await KI.records()

        let record = await next.next()
        expect(record).toMatchObject({
          done: false,
          value: {
            'Data': 'record one'
          }
        })

        record = await next.next()
        expect(record).toMatchObject({
          done: false,
          value: {
            'Data': 'record two'
          }
        })

      })

      it('returns the second record of the batch', async () => {
        const next = await KI.records()
        await next.next()

        let record = await next.next()
        expect(record).toMatchObject({
          done: false,
          value: {
            'Data': 'record two'
          }
        })
      })
    })


    describe('delay', () => {
      it('does not sleep if we get a full batch', async () => {
        KI = new KinesisIterator(kinesis, 'example-stream', 'LATEST', { limit: 1 })
        sleep = jest.spyOn(KI, 'sleep')
        sleep.mockResolvedValue(true)

        const next = await KI.records()
        await next.next()
        await next.next()
        await next.next()

        expect(KI.sleep).not.toHaveBeenCalled()
      })

      it('sleeps for a while if a batch was less than LIMIT', async () => {
        KI = new KinesisIterator(kinesis, 'example-stream', 'LATEST', {})
        const sleep = jest.spyOn(KI, 'sleep')
        sleep.mockResolvedValue(true)

        const next = await KI.records()
        await next.next()
        await next.next()
        await next.next()

        expect(KI.sleep).toHaveBeenCalledWith(KI.config.pollingDelay)
      })

    })
  })

  describe('implementation details', () => {

    it('calls listShards of the right stream', async () => {
      const next = await KI.records()
      await next.next()

      expect(kinesis.listShards).toHaveBeenCalledWith(
        expect.objectContaining({
          StreamName: 'example-stream'
        })
      )
    })

    it('calls getShardIterator on the right stream and shard', async () => {
      const next = await KI.records()
      await next.next()

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
      await next.next()

      expect(kinesis.getRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          ShardIterator: 'xxxyyyzzz'
        })
      )
    })

    it('calls getRecords with the shard iterator from the previous getRecords', async () => {
      const next = await KI.records()
      await next.next()
      await next.next()

      // boom: this is where it happens
      await next.next()

      expect(kinesis.getRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          ShardIterator: 'next-shard-iterator'
        })
      )
    })
  })
})
