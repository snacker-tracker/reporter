import EventHandler from '../lib/EventHandler'

import logger from '../lib/logger'
import axios from 'axios'

class PopulateProductDataFromInternet extends EventHandler {
  async run({ id, event, timestamp, payload, version, actor }) {
    this.services.logger.info({ event_handler: this.constructor.name, event, event_id: id, timestamp, version, payload, actor })

    const local = await this.services.productInfoStores.snacker.get(payload.code)
    const off = await this.services.productInfoStores.off.get(payload.code)

    const firstOf = (options, hash) => {
      for(const option of options) {
        if(hash[option] != undefined && hash[option] != '' && hash[options] != 'unknown') {
          return hash[option]
        }
      }
    }


    if(off) {
      //console.log(JSON.stringify(Object.keys(off.product), null, 2))
      let p = off.product

      const data = {
        code: payload.code,
        name: firstOf(['product_name_en', 'generic_name_en', 'product_name', 'generic_name', 'product_name_th', 'generic_name_th'], off.product)
      }

      try {
        true
        //const postResponse = await this.services.productInfoStores.snacker.post(data)
        //console.log(postResponse)
      } catch (error) {
        //console.log(error)
      }

      if(p.image_url) {
        const img_response = await axios.get(p.image_url, { responseType: 'arraybuffer' })
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
