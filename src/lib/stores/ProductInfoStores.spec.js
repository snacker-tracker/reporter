import stores from './index'
import axios from 'axios'

const Base = stores.ProductInfoStore

class TestStore extends Base {
  build_get_request(code) {
    return {
      method: 'get',
      url: ['test-store', code].join('/'),
      params: { code }
    }
  }

  map_object(code, response) {
    return response.data
  }
}

describe.skip('real tests', () => {
  describe(stores.UPCItemDBInfoStore, () => {
    it('should work', async () => {
      const instance = new stores.UPCItemDBInfoStore(
        'https://api.upcitemdb.com/',
        { axios }
      )

      const data = await instance.get('8850999220000')
      console.log(data)
    })
  })

  describe(stores.BigCInfoStore, () => {
    it('should work', async () => {
      const instance = new stores.BigCInfoStore(
        'https://www.bigc.co.th/',
        { axios }
      )

      const data = await instance.get('8850999220000')
      console.log(data)
    })
  })


  describe(stores.UPCItemDBInfoStore, () => {
    it('should work', async () => {
      const instance = new stores.UPCItemDBInfoStore(
        'https://api.upcitemdb.com/',
        { axios }
      )

      const data = await instance.get('8850999220000')
      console.log(data)
    })
  })


  describe(stores.OpenFoodFactsInfoStore, () => {
    it('should work', async () => {
      const instance = new stores.OpenFoodFactsInfoStore(
        'https://world.openfoodfacts.org/',
        { axios }
      )

      const data = await instance.get('8850999220000')
      console.log(data)
    })
  })

  describe.skip(stores.TopCoThInfoStore, () => {
    it('should work', async () => {
      const instance = new stores.TopsCoThInfoStore('https://www.tops.co.th/', { axios })

      const data = await instance.get('8858259003134')
      console.log(data)
    })
  })
})


describe('TestStore', () => {
  let fake_axios = {}
  let instance
  beforeEach( () => {
    fake_axios.post = jest.fn()
    fake_axios.post.mockResolvedValueOnce({
    })

    fake_axios.get = jest.fn()
    fake_axios.get.mockResolvedValueOnce({
    })

    fake_axios.create = jest.fn()
    fake_axios.create.mockReturnValue(fake_axios)

    instance = new TestStore('https://example.com/', {
      axios: fake_axios
    })
  })

  describe('.instantiation', () => {
    it('constructs an instance of axios w/ the correct baseURL', () => {
      expect(fake_axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://example.com/'
        })
      )
    })
  })

  describe('.get', () => {
    it('passes the result of .build_get_request() to .execute()', async () => {
      await instance.get('123456')

      expect(fake_axios.get).toHaveBeenCalledWith(
        'test-store/123456',
        {
          headers: {},
          params: {
            code: '123456'
          }
        }
      )
    })

    it('passes the result of execute to map_object', async () => {
      fake_axios.get.mockReset()
      fake_axios.get.mockResolvedValueOnce({
        data: {
          'some-property': 'some value'
        }
      })

      jest.spyOn(instance, 'map_object')

      await instance.get('123456')

      expect(instance.map_object).toHaveBeenCalledWith(
        '123456',
        expect.objectContaining({
          data: {
            'some-property': 'some value'
          }
        })
      )
    })

    it('returns the result of map_object', async () => {
      fake_axios.get.mockReset()
      fake_axios.get.mockResolvedValueOnce({
        data: {
          'some-property': 'some value'
        }
      })

      const response = await instance.get('123456')

      expect(response).toEqual(
        expect.objectContaining({
          'some-property': 'some value'
        })
      )
    })
  })

  describe(stores.SnackerTrackerInfoStore, () => {
    let store
    let tokenProvider = {}

    beforeEach(() => {
      tokenProvider.getToken = jest.fn()
      tokenProvider.getToken.mockResolvedValue('a token')


      store = new stores.SnackerTrackerInfoStore('https://example.com/', {
        axios: fake_axios,
        tokenProvider
      })
    })

    describe('authentication', () => {
      it('uses token provider if it is supplied', async () => {
        await store.get('example code')

        expect(tokenProvider.getToken).toHaveBeenCalled()
        expect(fake_axios.get).toHaveBeenCalledWith(
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
})
