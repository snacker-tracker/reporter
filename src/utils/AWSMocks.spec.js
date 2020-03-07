import {
  Kinesis
} from './AWSMocks'

describe(Kinesis, () => {
  let mocked
  beforeEach( () => {
    mocked = new Kinesis()
  })

  describe('resolve or reject', () => {
    it('resolves to the desired result', async () => {
      mocked.listShards.mockResolvedValue('resolves to this')
      expect(mocked.listShards('asd').promise()).resolves.toBe('resolves to this')
    })

    it('rejects with the desired result', async () => {
      mocked.listShards.mockRejectedValue('rejects to this')

      expect(mocked.listShards('asd').promise()).rejects.toBe('rejects to this')
    })
  })

  it('reports the called arguments', async () => {
    const k = new Kinesis()

    k.listShards.mockResolvedValue('resolved value')

    const listShardsArgument = 'blah'

    await k.listShards(listShardsArgument).promise()

    expect(k.listShards).toHaveBeenCalledWith(listShardsArgument)
  })

  describe('concurrency', () => {
    it('returns the results it was assigned', async () => {
      const firstInstance = new Kinesis()
      const secondInstance = new Kinesis()

      const firstResponse = 'first instance shards'
      const secondResponse = 'second instance shards'


      firstInstance.listShards.mockResolvedValue(firstResponse)
      secondInstance.listShards.mockResolvedValue(secondResponse)

      expect(secondInstance.listShards().promise()).resolves.toBe(secondResponse)
      expect(firstInstance.listShards().promise()).resolves.toBe(firstResponse)

    })

    it('records the arguments it was given', async () => {
      const firstInstance = new Kinesis()
      const secondInstance = new Kinesis()

      const firstResponse = 'first instance shards'
      const secondResponse = 'second instance shards'

      firstInstance.listShards.mockResolvedValue(firstResponse)
      secondInstance.listShards.mockResolvedValue(secondResponse)

      await secondInstance.listShards(secondResponse)
      await firstInstance.listShards(firstResponse)

      expect(secondInstance.listShards).toHaveBeenCalledWith(secondResponse)
      expect(firstInstance.listShards).toHaveBeenCalledWith(firstResponse)
    })
  })
})
