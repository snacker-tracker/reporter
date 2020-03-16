import FormData from 'form-data'
import axios from 'axios'

class ProductInfoStore {
  constructor(base_url, options = {}) {
    Object.assign(this, options)

    this.axios = options.axios.create({
      baseURL: base_url
    })
  }

  firstOf(options, hash) {
    for(const option of options) {
      if(hash[option] != undefined && hash[option] != '' && hash[options] != 'unknown') {
        return hash[option]
      }
    }
  }

  async get(code) {
    const request = this.build_get_request(code)
    const response = await this.execute(request)
    return this.map_object(code, response)
  }

  async execute(request) {
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

class OpenFoodFactsInfoStore extends ProductInfoStore {
  build_get_request(code) {
    // 'https://world.openfoodfacts.org/api/v0/product/' + code + '.json',
    return {
      method: 'get',
      url: 'api/v0/product/' + code + '.json'
    }
  }

  map_object(code, response) {
    if(response.data.status === 0) {
      return false
    }

    const item = {}

    item.name = this.getName(response.data)
    item.images = this.getImages(response.data)
    item.categories = this.getCategories(response.data)

    return item
  }

  getImages(data) {
    const images = []
    if(data.product.image_url) {
      images.push(data.product.image_url)
    }

    return images
  }

  getName(data) {
    return this.firstOf([
      'product_name_en',
      'generic_name_en',
      'product_name',
      'generic_name',
      'product_name_th',
      'generic_name_th'
    ], data.product)
  }

  getCategories(data) {
    let categories = []
    if(data.product.categories_hierarchy && data.product.categories_hierarchy.length > 0) {
      categories = data.product.categories_hierarchy.map( (category) => {
        const split = category.split(':')
        if(split[0] == 'th') {
          return 'untranslated'
        } else {
          return split[1].replace(/-/g, '_').replace(/ /g, '_')
        }
      })
    }

    return categories
  }
}

class TopsCoThInfoStore extends ProductInfoStore {
  build_get_request(code) {
    return {
      method: 'get',
      url: 'api/search/suggestions',
      params: {
        query: code
      },
      headers: {
        'x-store-code': 'tops_sa_432_th'
      }
    }
  }

  map_object(code, response) {
    const data = this.getBase(code, response)
    const item = {}

    item.name = this.getName(data)
    item.images = this.getImages(data)
    item.categories = []

    return item
  }

  getBase(code, response) {
    const searching_for_code = code
    const data = response.data.filter( item => {
      return item.sku == searching_for_code
    })[0]

    if(data === undefined) {
      return false
    }

    return data
  }

  getName(data) {
    return data.title
  }

  getImages(data) {
    if(data.image) {
      return [
        'https://backend.tops.co.th/media/catalog/product/' + data.image
      ]
    } else {
      return []
    }
  }
}

class SnackerTrackerInfoStore extends ProductInfoStore {
  async get(code) {
    try {
      const response = await this.execute({
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
      const response = await this.execute({
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
    const response = await this.execute({
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

    const response = await this.execute({
      method: 'post',
      url: ['codes', code, 'pictures'].join('/'),
      payload: form,
      headers: form.getHeaders()
    })

    return response.data
  }

  async get_pictures(code) {
    try {
      const response = await this.execute({
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
}


class UPCItemDBInfoStore extends ProductInfoStore {
  build_get_request(code) {
    return {
      url: 'prod/trial/lookup',
      params: {
        upc: code
      }
    }
  }

  map_object(code, response) {
    if(response.data.code !== 'OK') {
      return false
    }

    if(response.data.items.length == 0) {
      return false
    }

    const item = {}
    item.name = this.getName(response.data)
    item.images = []
    item.categories = []

    return item
  }

  getName(data) {
    return data[0].title
  }

  getImages(data) {
    return data[0].images
  }

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

class BigCInfoStore extends ProductInfoStore {
  build_get_request(code) {
    return {
      method: 'get',
      url: 'api/common/search/products',
      params: {
        q: code,
        _store: 2
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-agent': 'Mozilla Firefox'
      }
    }
  }

  map_object(code, response) {
    const item = this.getBase(code, response.data)
    if(!item) {
      return false
    }

    return item
  }

  getBase(code, data) {
    if(!data.result) {
      return false
    }

    if(data.result.itemCount > 0) {
      return {
        name: data.result.product[0].name,
        images: [data.result.product[0].image, ['https://static.bigc.co.th/media/catalog/product', code.slice(0,1), code.slice(1,2), `${code}.jpg`].join('/')]
      }
    }

    return false
  }
}


export default {
  ProductInfoStore,
  BigCInfoStore,
  OpenFoodFactsInfoStore,
  UPCItemDBInfoStore,
  SnackerTrackerInfoStore,
  TopsCoThInfoStore
}
