import FormData from 'form-data'
import axios from 'axios'

class TopsCoThInfoStore {
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

      let data = response.data.filter( item => {
        return item.sku == code
      })[0]

      if(data === undefined) {
        return false
      }

      let result = {
        name: data.title
      }

      if(data.image) {
        result.images = ['https://backend.tops.co.th/media/catalog/product/' + data.image]
      } else {
        result.images = []
      }

      return result
    } catch( error ) {
      console.log(code, error)
      return false
    }
  }
}

class SnackerTrackerInfoStore {
  constructor(base_url, options = {}) {
    Object.assign(this, options)

    this.axios = options.axios.create({
      baseURL: base_url
    })
  }
  async get(code) {
    try {
      const response = await this._request({
        method: 'get',
        url: ['codes', code].join('/'),
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      return response.data
    } catch( error ) {
      return false
    }
  }

  async post(code_and_info) {
    try {
      const response = await this._request({
        method: 'post',
        url: ['codes'].join('/'),
        payload: code_and_info
      })

      return response.data

    } catch(error) {
      console.log(error)
      throw error
    }
  }

  async patch(code, payload) {
    const response = await this._request({
      method: 'patch',
      url: ['codes', code].join('/'),
      payload,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    return response.data
  }

  async post_picture(code, buffer) {
    const form = new FormData()
    form.append('picture', buffer, {
      filename: 'picture',
      contentType: 'image/jpeg'
    })

    const response = await this._request({
      method: 'post',
      url: ['codes', code, 'pictures'].join('/'),
      payload: form,
      headers: form.getHeaders()
    })

    return response.data
  }

  async get_pictures(code) {
    try {
      const response = await this._request({
        method: 'get',
        url: ['codes', code, 'pictures'].join('/'),
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      return response.data.items
    } catch( error ) {
      return false
    }
  }

  async _request(request) {
    const headers = request.headers || {}
    if(this.tokenProvider) {
      const token = await this.tokenProvider.getToken()
      headers['Authorization'] = ['Bearer', token].join(' ')
    }

    const axios_params = [request.url]

    if(request.method !== 'get') {
      axios_params.push(request.payload)
    }

    axios_params.push({
      params: request.params,
      headers
    })

    return this.axios[request.method].apply(axios, axios_params)
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
        resp.categories = response.data.product.categories_hierarchy.map( (category) => {
          const split = category.split(':')
          if(split[0] == 'th') {
            return 'untranslated'
          } else {
            return split[1].replace(/-/g, '_').replace(/ /g, '_')
          }
        })
      } else {
        resp.categories = []
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

      const data = response.data

      if(data.code === 'OK') {
        if(data.items.length > 0) {
          const item = data.items[0]
          return {
            name: item.title,
            brand: item.brand,
            images: item.images
          }
        }
      }

      return false
    } catch(error) {
      //console.log('Failed to query the UPC database')
      return false
    }
  }
}

class BigCInfoStore {
  async get(code) {
    let bigc_result
    try {
      // https://www.bigc.co.th/api/common/search/products?_store=2&q=8854698015523
      bigc_result = await axios.get(
        'https://www.bigc.co.th/api/common/search/products',
        {
          params: {
            q: code,
            _store: 2
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'User-agent': 'Mozilla Firefox'
          }
        }
      )

      if(bigc_result.data.result) {
        if(bigc_result.data.result.itemCount > 0) {
          return {
            name: bigc_result.data.result.product[0].name,
            images: [bigc_result.data.result.product[0].image, ['https://static.bigc.co.th/media/catalog/product', code.slice(0,1), code.slice(1,2), `${code}.jpg`].join('/')]
          }
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
