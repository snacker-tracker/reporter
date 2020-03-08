import KinesisIterator from './KinesisIterator'
import { Kinesis } from '../../utils/AWSMocks'

class ExpiredIteratorException {}

describe(KinesisIterator, () => {
  let KI
  let kinesis
  let sleep

  beforeEach( () => {
    kinesis = new Kinesis()

    kinesis.listShards.mockResolvedValue({
      Shards: [ { ShardId: 'shard-00000001' } ]
    })

    kinesis.getShardIterator.mockResolvedValue({
      ShardIterator: 'xxxyyyzzz'
    })

    kinesis.getRecords.mockResolvedValue({
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

    it('retries at the last know checkpoint if the iterator expires', async () => {

      const kinesis = new Kinesis()
      kinesis.listShards.mockResolvedValue({
        Shards: [ { ShardId: 'shard-00000001' } ]
      })

      kinesis.getShardIterator.mockResolvedValueOnce({
        ShardIterator: 'first-shard-iterator'
      })

      kinesis.getShardIterator.mockResolvedValueOnce({
        ShardIterator: 'the-at-sequence-iterator'
      })


      kinesis.getRecords.mockResolvedValueOnce({
        NextShardIterator: 'next-shard-iterator',
        Records: [
          { 'Data': 'record one', SequenceNumber: 'one' },
          { 'Data': 'record two', SequenceNumber: 'two' }
        ],
      })

      kinesis.getRecords.mockRejectedValueOnce(new ExpiredIteratorException())

      kinesis.getRecords.mockResolvedValueOnce({
        NextShardIterator: 'another-next-shard-iterator',
        Records: [
          { 'Data': 'record one', SequenceNumber: 'three' },
          { 'Data': 'record two', SequenceNumber: 'four' }
        ]
      })


      KI = new KinesisIterator(kinesis, 'example-stream', 'LATEST', {})
      sleep = jest.spyOn(KI, 'sleep')
      sleep.mockResolvedValue(true)

      const iterator = await KI.records()

      await iterator.next()
      await iterator.next()
      await iterator.next()

      expect(kinesis.getShardIterator).toHaveBeenNthCalledWith( 1,
        expect.objectContaining({
          StreamName: 'example-stream',
          ShardId: 'shard-00000001',
          ShardIteratorType: 'LATEST'
        })
      )

      expect(kinesis.getShardIterator).toHaveBeenNthCalledWith( 2,
        expect.objectContaining({
          StreamName: 'example-stream',
          ShardId: 'shard-00000001',
          ShardIteratorType: 'AFTER_SEQUENCE_NUMBER',
          StartingSequenceNumber: 'two'
        })
      )

      expect(kinesis.getRecords).toHaveBeenNthCalledWith(3,
        expect.objectContaining({
          'ShardIterator': 'the-at-sequence-iterator'
        })
      )
    })
  })
})
