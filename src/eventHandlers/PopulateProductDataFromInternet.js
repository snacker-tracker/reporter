import EventHandler from '../lib/EventHandler'

import logger from '../lib/logger'
import axios from 'axios'

const sleep = async (delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve(true); }, delay)
  })
}

class PopulateProductDataFromInternet extends EventHandler {
  async run({ id, event, timestamp, payload, version, actor }) {
    this.services.logger.setContext('code', payload.code)
    this.services.logger.info({msg: "Start processing"})

    const local = await this.services.productInfoStores.snacker.get(payload.code)
    this.services.logger.info({
      "msg":" Got local",
      local
    })

    const off = await this.services.productInfoStores.off.get(payload.code)
    this.services.logger.info({
      "msg":" Got off",
      off
    })

    const tops = await this.services.productInfoStores.tops.get(payload.code)
    this.services.logger.info({
      "msg":" Got tops",
      tops
    })

    let images = []

    if(tops) {
      images = images.concat(tops.images)
    }

    if(off) {
      images = images.concat(off.images)
    }

    if(local === false ) {
      let createPayload = false
      if(off) {
        createPayload = {
          code: payload.code,
          name: off.name,
          categories: off.categories
        }
        this.services.logger.info({msg: 'Creating using OpenFoodFacts', data: createPayload})
      } else if(tops) {
        createPayload = {
          code: payload.code,
          name: tops.name
        }
        this.services.logger.info({msg: 'Creating using OpenFoodFacts', data: createPayload})
      } else {
        this.services.logger.info({msg: 'Did not find in TOPS or OFF'})
      }

      if(createPayload) {
        try {
          const postResponse = await this.services.productInfoStores.snacker.post(createPayload)
          this.services.logger.info({ 'CreateCodeResponse': postResponse })
        } catch( error ) {
          this.services.logger.warn({
            code: payload.code,
            status: error.response.status,
            body: error.response.data
          })
        }
      }
    } else {
      if(!local.categories || local.categories.length === 0) {
        const patchResponse = await this.services.productInfoStores.snacker.patch(payload.code, {
          categories: off.categories
        })

      }
    }

    if(images.length > 0) {
      this.services.logger.info({
        "msg": "Got images",
        images
      })

      for(const image of images) {
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
