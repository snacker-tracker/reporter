import axios from 'axios'

import EventHandler from '../../lib/streaming/EventHandler'


class PopulateProductDataFromInternet extends EventHandler {
  async query(provider, code) {
    try {
      const response = await this.services.productInfoStores[provider].get(code)
      this.services.logger.info({
        'msg': ['got', provider].join(' '),
        response
      })

      return response
    } catch(error) {
      this.services.logger.warn(['failed to get', provider].join(' '))
      return false
    }
  }

  firstOf(options) {
    for(const option of options) {
      if(typeof(option) == 'string') {
        if(option !== '' && option !== 'unknown') {
          return option
        }
      }
    }

    return false
  }


  merge(sources) {
    const merged = {}
    merged.name = this.firstOf([
      sources.off.name,
      sources.tops.name,
      sources.bigc.name,
      sources.upcdb.name
    ])

    if(sources.off) {
      merged.categories = sources.off.categories || []
    }

    const images = Object.values(sources).map((source) => {
      return source.images ? source.images : []
    })

    merged.images = [].concat.apply([], images)

    return merged
  }

  async run({ payload }) {
    this.services.logger.setContext('code', payload.code)
    this.services.logger.info('start processing')

    let local = await this.query('snacker', payload.code)

    if(local) {
      this.services.logger.info('stop here, we know about this product')
      return true
    }

    let off = await this.query('off', payload.code)
    let tops = await this.query('tops', payload.code)
    let upcdb = await this.query('upcdb', payload.code)
    let bigc = await this.query('bigc', payload.code)

    const product_info = this.merge({
      off, tops, upcdb, bigc
    })

    if(product_info.name) {
      this.services.logger.info(`Using "${product_info.name}" as name`)
      let createPayload = {
        code: payload.code,
        name: product_info.name,
        categories: product_info.categories || []
      }

      this.services.logger.info({ createPayload })

      try {
        local = await this.services.productInfoStores.snacker.post(createPayload)

        if(product_info.images.length > 0) {
          for(const image of product_info.images) {
            try {
              const img_response = await this.download_picture(image)
              if(img_response) {
                await this.upload_picture(payload.code, img_response.data)
              }
            } catch(error) {
              this.services.logger.warn('Caught exception while processing an image')
              this.services.logger.warn(error)
            }
          }
        }
      } catch(error) {
        this.services.logger.warn('Caught exception while processing an code')
        this.services.logger.warn(error)
      }
    }

    return true
  }

  async download_picture(url) {
    try {
      this.services.logger.info({ msg: 'Downloading picture', url })
      return await axios.get(url, { responseType: 'arraybuffer' })
    } catch( error ) {
      this.services.logger.info({ 'msg': 'Failed to download image', error })
      return false
    }
  }

  async upload_picture(code, picture) {
    try {
      await this.services.productInfoStores.snacker.post_picture(code, picture)
      this.services.logger.info('image uploaded')
      return true
    } catch(error) {
      this.services.logger.warn({ 'msg': 'Failed to upload image', error })
      return false
    }
  }
}


export default PopulateProductDataFromInternet
