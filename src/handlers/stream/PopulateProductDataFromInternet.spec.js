import PopulateProductDataFromInternet from './PopulateProductDataFromInternet'
import Logger from '../../lib/Logger'
import stores from '../../lib/stores/'

describe(PopulateProductDataFromInternet, () => {
  let handler
  let logger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    setContext: () => {}
  }
  let storeSpies = {}
  let post_spies = {}
  let download_picture

  let axios = {
    create: function() {
      return this
    }
  }

  let dependencies = {
    logger,
    productInfoStores: {
      snacker: new stores.SnackerTrackerInfoStore('https://some-url.com', { axios }),
      tops: new stores.TopsCoThInfoStore('https://example.com', { axios }),
      bigc: new stores.BigCInfoStore('https://example.com', { axios }),
      off: new stores.OpenFoodFactsInfoStore('https://example.com', { axios }),
      upcdb: new stores.UPCItemDBInfoStore('https://example.com', { axios })
    }
  }

  let event = {
    event: 'ScanCreated',
    payload: {
      code: '123456789'
    }
  }

  const postSpies = () => {
    const post_spies = {}
    post_spies['post'] = jest.spyOn(
      dependencies.productInfoStores.snacker,
      'post'
    )
    post_spies.post.mockResolvedValue(true)
    post_spies.post.mockName('snacker.post')

    post_spies['post_picture'] = jest.spyOn(
      dependencies.productInfoStores.snacker,
      'post_picture'
    )
    post_spies.post_picture.mockResolvedValue(true)
    post_spies.post_picture.mockResolvedValue(true)

    return post_spies

  }

  beforeEach(() => {
    Object.entries(dependencies.productInfoStores).forEach(([key, store]) => {
      storeSpies[key] = jest.spyOn(store, 'get')
      storeSpies[key].mockName([key, 'get'].join('.'))
    })

    post_spies = postSpies()

    handler = new PopulateProductDataFromInternet(dependencies)

    download_picture = jest.spyOn(
      handler,
      'download_picture'
    )

    download_picture.mockResolvedValue('some kind of binary blob')

  })

  describe('if we already know about this product', () => {
    it('exits if we already have it locally', async () => {
      storeSpies.snacker.mockResolvedValue({
        code: '1234567890',
        name: 'my product'
      })

      await handler.run(event)

      expect(storeSpies.snacker).toHaveBeenCalledWith(event.payload.code)
      expect(storeSpies.off).not.toHaveBeenCalled()
    })
  })

  describe('if we dont know about this product', () => {
    beforeEach( () => {
      storeSpies.snacker.mockRejectedValue('Not Found')

      storeSpies.off.mockResolvedValue({ name: 'off product', categories: ['cat1', 'cat2'], pictures: ['url1'] })
      storeSpies.tops.mockResolvedValue({ name: 'tops product' })
      storeSpies.bigc.mockResolvedValue({ name: 'bigc product' })
      storeSpies.upcdb.mockResolvedValue({ name: 'upcdb product' })
    })

    it('queries the alternative sources', async () => {
      await handler.run(event)

      expect(storeSpies.off).toHaveBeenCalledWith(event.payload.code)
      expect(storeSpies.tops).toHaveBeenCalledWith(event.payload.code)
      expect(storeSpies.bigc).toHaveBeenCalledWith(event.payload.code)
      expect(storeSpies.upcdb).toHaveBeenCalledWith(event.payload.code)
    })

    it('should merge the information', async () => {
      const spy = jest.spyOn(handler, 'merge')
      spy.mockReturnValue({})

      await handler.run(event)

      expect(spy).toHaveBeenCalledWith({
        tops: { name: 'tops product' },
        bigc: { name: 'bigc product' },
        off: { name: 'off product', categories: ['cat1','cat2'], pictures: ['url1'] },
        upcdb: { name: 'upcdb product' }
      })
    })

    describe('information merging', () => {
      describe('product name', () => {
        it('uses OFF first', () => {
          const merged = handler.merge({
            tops: { name: 'tops product' },
            bigc: { name: 'bigc product' },
            off: { name: 'off product', categories: ['cat1', 'cat2'] },
            upcdb: { name: 'upcdb product' }
          })

          expect(merged.name).toBe('off product')
        })

        it('uses TOPS second', () => {
          const merged = handler.merge({
            tops: { name: 'tops product' },
            bigc: { name: 'bigc product' },
            off: false,
            upcdb: { name: 'upcdb product' }
          })

          expect(merged.name).toBe('tops product')
        })

        it('uses BIGC third', () => {
          const merged = handler.merge({
            tops: false,
            bigc: { name: 'bigc product' },
            off: false,
            upcdb: { name: 'upcdb product' }
          })

          expect(merged.name).toBe('bigc product')
        })
      })

      describe('categories', () => {
        it('uses categories from OFF if available', () => {
          const merged = handler.merge({
            tops: { name: 'tops product' },
            bigc: { name: 'bigc product' },
            off: { name: 'off product', categories: ['cat1', 'cat2'] },
            upcdb: { name: 'upcdb product' }
          })

          expect(merged.categories.length).toBe(2)
        })
      })

      describe('pictures', () => {
        it('returns all pictures', () => {
          const merged = handler.merge({
            tops: { name: 'tops product', pictures: ['one'] },
            bigc: { name: 'bigc product', pictures: ['two'] },
            off: { name: 'off product', pictures: ['three', 'four'] },
            upcdb: { name: 'upcdb product', pictures: ['five'] }
          })

          expect(merged.pictures.length).toBe(5)
        })
      })
    })

    describe('uploading information', () => {
      describe('if we dont have enough information', () => {

      })

      describe('create the code object', () => {
        it('posts the code object', async () => {
          await handler.run(event)

          expect(post_spies.post).toHaveBeenCalledWith({
            code: '123456789',
            name: 'off product',
            categories: ['cat1', 'cat2']
          })
        })
      })

      describe('upload the pictures', () => {
        it('doesnt bother uploading if it downloading failed', async () => {
          download_picture.mockResolvedValue(false)

          await handler.run(event)

          expect(post_spies.post_picture).not.toHaveBeenCalled()
        })

        it('downloads and uploads pictures', async () => {
          await handler.run(event)

          expect(post_spies.post_picture).toHaveBeenCalled()
        })
      })
    })
  })

  afterEach( () => {
    Object.entries(dependencies.productInfoStores).forEach(([key, store]) => {
      storeSpies[key].mockRestore()
    })

    post_spies.post.mockRestore()
    post_spies.post_picture.mockRestore()
  })
})
