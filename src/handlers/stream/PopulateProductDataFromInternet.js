import axios from 'axios'

import logger from '../../lib/logger'

import EventHandler from '../../lib/streaming/EventHandler'

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
    this.services.logger.info({ msg: 'Start and end processing' })

    let local = false
    try {
      local = await this.services.productInfoStores.snacker.get(payload.code)
      this.services.logger.info({
        'msg': 'Got local',
        local
      })
    } catch(error) {
      this.services.logger.warn({
        'msg': 'Failed to get local'
      })
    }

    let off = false
    try {
      off = await this.services.productInfoStores.off.get(payload.code)
      this.services.logger.info({
        'msg': 'Got off',
        off
      })
    } catch(error) {
      this.services.logger.warn({
        'msg': 'Failed to get off'
      })
    }

    let tops = false
    try {
      tops = await this.services.productInfoStores.tops.get(payload.code)
      this.services.logger.info({
        'msg': 'Got tops',
        tops
      })
    } catch(error) {
      this.services.logger.warn({
        'msg': 'Failed to get tops'
      })
    }

    let upcdb = false
    try {
      upcdb = await this.services.productInfoStores.upcdb.get(payload.code)
      this.services.logger.info({
        'msg': 'Got upcdb',
        upcdb
      })
    } catch(error) {
      this.services.logger.warn({
        'msg': 'Failed to get upcdb'
      })
    }

    let bigc = false
    try {
      bigc = await this.services.productInfoStores.bigc.get(payload.code)
      this.services.logger.info({
        'msg': 'Got bigc',
        bigc
      })
    } catch(error) {
      this.services.logger.warn({
        'msg': 'Failed to get bigc'
      })
    }

    let images = []

    if(tops) {
      images = images.concat(tops.images)
    }

    if(off) {
      images = images.concat(off.images)
    }

    if(bigc) {
      images = images.concat(bigc.images)
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


        try {
          local = await this.services.productInfoStores.snacker.post(createPayload)
          local.categories = local.categories.filter( c => {
            return c != ''
          })

          this.services.logger.info({ msg: 'Created code', code: local })
        } catch(error) {
          this.services.logger.info('failed to create code')
        }
      } else {
        this.services.logger.info('Couldn\'t determine name')
      }
    }

    const shouldPatchCategories = local.categories != off.categories
    if(shouldPatchCategories) {
      try {
        this.services.productInfoStores.snacker.patch(payload.code, {
          categories: off.categories
        })
      } catch(error) {
        this.services.logger.warn('failed to patch code')
        this.services.logger.warn(error)
      }
    }

    let local_pictures
    try {
      local_pictures = await this.services.productInfoStores.snacker.get_pictures(payload.code)
    } catch(error) {
      this.services.logger.warn('failed to get local pictures')
    }

    const shouldUploadPictures = local_pictures && local_pictures.length === 0 && images.length > 0
    if(shouldUploadPictures) {
      for(const image of images) {
        this.services.logger.info({ msg: 'Downloading picture', url: image })

        let img_response, extension
        try {
          img_response = await axios.get(image, { responseType: 'arraybuffer' })
          extension = img_response.headers['content-type'].split('/')[1]
        } catch( error ) {
          this.services.logger.info({ 'msg': 'Failed to download image', error })
          continue
        }

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
