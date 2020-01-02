import axios from 'axios'
import FormData from 'form-data'

// https://www.tops.co.th/api/search/suggestions?query=8858259003134
// curl 'https://www.tops.co.th/api/search/suggestions?query=8858259003134' -H 'x-store-code: tops_sa_432_th'

class TopsCoThInfoStore {
  /*
    [{
      "type": "product",
      "sku": "8858259003134",
      "title": "ซานมิกไลท์เบียร์ขวด 330ซีซี",
      "image": "/8/8/8858259003134_11-09-19.jpg",
      "url": "san-miguel-light-beer-bottle-330cc-8858259003134",
      "price": "41.0000",
      "final_price": "41.0000",
      "price_html": "<span class=\"price\">฿41.0000</span>",
      "count": 27,
      "breadcrumb": [
        "เครื่องดื่มแอลกอฮอล์",
        "เบียร์",
        "เบียร์ลาเกอร์"
      ]
    }, {}]
  */
  async get(code) {
    try {
      const response = await axios.get(
        ['https://www.tops.co.th/api/search/suggestions?query=', code].join(''),
        {
          headers: {
            'x-store-code': 'tops_sa_432_th'
          }
        }
      )

      let result = response.data.filter( result => {
        return result.sku == code
      })[0]

      result = {
        name: result.title
      }

      if(result.image) {
        result.images = ['https://backend.tops.co.th/media/catalog/product/' + result.image]
      } else {
        result.images = []
      }

      return result
    } catch( error ) {
      //console.log(code, error.config)
      return false
    }
  }
}

class SnackerTrackerInfoStore {
  constructor(base_url, options = {}) {
    this.base_url = base_url
  }
  async get(code) {
    try {
      const response = await axios.get(
        this.base_url + '/codes/' + code,
        {
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      )

      return response.data
    } catch( error ) {
      //console.log(code, error.config)
      return false
    }
  }

  async post(code_and_info) {
    const response = await axios.post(
      [this.base_url, 'codes'].join('/'),
      code_and_info
    )

    return response.data
  }

  async patch(code, payload) {
    const response = await axios.patch(
      [this.base_url, 'codes', code].join('/'),
      payload
    )

    return response.data
  }

  async post_picture(code, buffer) {
    const form = new FormData()
    form.append('picture', buffer, {
      filename: 'picture',
      contentType: 'image/jpeg'
    })

    const response = await axios.post(
      [this.base_url, 'codes', code, 'pictures'].join('/'),
      form,
      {
        headers: form.getHeaders()
      }
    )

    return response.data

  }
}

class OpenFoodFactsInfoStore {
  async get(code) {
    const firstOf = (options, hash) => {
      for(const option of options) {
        if(hash[option] != undefined && hash[option] != '' && hash[options] != 'unknown') {
          return hash[option]
        }
      }
    }

    // https://world.openfoodfacts.org/api/v0/product/8850999220000.json
    try {
      const response = await axios.get(
        'https://world.openfoodfacts.org/api/v0/product/' + code + '.json',
        {
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      )

      if(response.data.status === 0) {
        return false
      }

      let resp = {
        name: firstOf([
          'product_name_en',
          'generic_name_en',
          'product_name',
          'generic_name',
          'product_name_th',
          'generic_name_th'
        ], response.data.product)
      }

      if(response.data.product.image_url) {
        resp.images = [ response.data.product.image_url ]
      } else {
        resp.images = []
      }

      if(response.data.product.categories_hierarchy && response.data.product.categories_hierarchy.length > 0) {
        resp.categories = response.data.product.categories_hierarchy.map( (e) => {
          const split = e.split(':')
          if(split[0] == 'th') {
            return 'untranslated'
          } else {
            return split[1].replace(/-/g, '_')
          }
        })
      } else {
        response.categories = []
      }

      return resp
    } catch( error ) {
      //console.log(error)
      return false
    }
  }
}

class UPCItemDBInfoStore {
  async get(code) {
    try {
      const response = await axios.get(
        'https://api.upcitemdb.com/prod/trial/lookup',
        {
          params: {
            upc: code
          }
        }
      )

      console.log(JSON.stringify(response.headers, null, 2))
      console.log(JSON.stringify(response.data, null, 2))

      return response.data

    } catch(error) {
      console.log('Failed to query the UPC database')
      return false
    }

  }
}

class BigCInfoStore {
  async get(code) {
    let bigc_result
    try {
      bigc_result = await axios.get(
        'https://www.bigc.co.th/sb.php',
        {
          params: {
            q: code,
            storeid: 1,
            currencycode: 'THB'
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'User-agent': 'Mozilla Firefox'
          }
        }
      )

      if(bigc_result.data.response) {
        if(bigc_result.data.response.numFound > 0) {
          return bigc_result.data.response.docs[0]
        }
      }

      return false
    } catch(error) {
      console.log(error)
      console.log({
        message: 'read local ...',
        status: error.response.status,
        headers: error.response.headers
      })

      return false
    }
  }
}


export default {
  BigCInfoStore,
  OpenFoodFactsInfoStore,
  UPCItemDBInfoStore,
  SnackerTrackerInfoStore,
  TopsCoThInfoStore
}
