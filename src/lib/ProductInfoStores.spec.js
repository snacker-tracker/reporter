import stores from './ProductInfoStores'
import TokenProvider from './TokenProvider'

describe(stores.SnackerTrackerInfoStore, () => {
  let store
  let tokenProvider = {}
  let axios = {}

  beforeEach(() => {
    tokenProvider.getToken = jest.fn()
    tokenProvider.getToken.mockResolvedValue('a token')

    axios.post = jest.fn()
    axios.post.mockResolvedValueOnce({
    })

    axios.get = jest.fn()
    axios.get.mockResolvedValueOnce({
    })

    axios.create = jest.fn()
    axios.create.mockReturnValue(axios)

    store = new stores.SnackerTrackerInfoStore('https://reporter.snacker-tracker.qa.k8s.fscker.org/v1/', {
      axios,
      tokenProvider
    })
  })

  describe('for real', () => {
    it('makes a real request', async () => {
      const response = await store.get('8850999220000')
    })
  })

  describe('authentication', () => {
    it('uses token provider if it is supplied', async () => {
      await store.get('example code')

      expect(tokenProvider.getToken).toHaveBeenCalled()
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String)
          })
        })
      )
    })
  })
})
