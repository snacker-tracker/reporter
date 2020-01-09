import EventHandler from '../lib/EventHandler'

import logger from '../lib/logger'
import axios from 'axios'

const sleep = async (delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve(true) }, delay)
  })
}

const firstOf = (options) => {
  for(const option of options) {
    if(typeof(option) == 'string') {
      if(option !== '' && option !== 'unknown') {
        return option
      }
    }
  }

  return false
}


class PopulateProductDataFromInternet extends EventHandler {
  async run({ id, event, timestamp, payload, version, actor }) {
    this.services.logger.setContext('code', payload.code)
    this.services.logger.info({ msg: 'Start processing' })

    let local = await this.services.productInfoStores.snacker.get(payload.code)
    this.services.logger.info({
      'msg': 'Got local',
      local
    })

    const off = await this.services.productInfoStores.off.get(payload.code)
    this.services.logger.info({
      'msg': 'Got off',
      off
    })

    const tops = await this.services.productInfoStores.tops.get(payload.code)
    this.services.logger.info({
      'msg': 'Got tops',
      tops
    })

    const upcdb = await this.services.productInfoStores.upcdb.get(payload.code)
    this.services.logger.info({
      msg: 'Got UPCDB',
      upcdb
    })

    const bigc = await this.services.productInfoStores.bigc.get(payload.code)
    this.services.logger.info({
      msg: 'Got BigC',
      bigc
    })

    let images = []

    if(tops) {
      images = images.concat(tops.images)
    }

    if(off) {
      images = images.concat(off.images)
    }

    const shouldCreate = local === false

    if(shouldCreate) {
      const name = firstOf([
        off.name,
        tops.name,
        bigc.name,
        upcdb.name
      ])

      if(name) {
        this.services.logger.info(`Using "${name}" as name`)
        let createPayload = {
          code: payload.code,
          name,
          categories: off.categories || []
        }
        this.services.logger.info({ createPayload })

        local = await this.services.productInfoStores.snacker.post(createPayload)
        local.categories = local.categories.filter( c => {
          return c != ''
        })

        this.services.logger.info({ msg: 'Created code', code: local })
      } else {
        this.services.logger.info('Couldn\'t determine name')
      }
    }

    const shouldPatchCategories = local.categories != off.categories
    if(shouldPatchCategories) {
      this.services.productInfoStores.snacker.patch(payload.code, {
        categories: off.categories
      })
    }

    const local_pictures = this.services.productInfoStores.snacker.get_pictures(payload.code)

    const shouldUploadPictures = local_pictures.length === 0 && images.length > 0
    if(shouldUploadPictures) {
      for(const image of images) {
        this.services.logger.info({ msg: 'Downloading picture', url: image })

        const img_response = await axios.get(image, { responseType: 'arraybuffer' })
        const extension = img_response.headers['content-type'].split('/')[1]

        try {
          const picture = await this.services.productInfoStores.snacker.post_picture(payload.code, img_response.data)
          this.services.logger.info({ msg: 'Image uploaded', picture })
        } catch(error) {
          this.services.logger.info({ 'msg': 'Failed to upload image', error })
        }
      }
    }

    return true
  }
}


export default PopulateProductDataFromInternet
