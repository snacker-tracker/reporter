import stores from './ProductInfoStores'

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
