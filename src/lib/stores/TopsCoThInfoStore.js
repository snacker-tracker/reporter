import ProductInfoStore from './ProductInfoStore'

class TopsCoThInfoStore extends ProductInfoStore {
  build_get_request(code) {
    return {
      method: 'get',
      url: '/v2/api/search/products',
      params: {
        query: code,
        sort: 'ranking_desc'
      },
      headers: {
        'x-store-code': 'tops_sa_432_th',
        'cookie': 'lang=en_US'
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
    const data = response.data.items.filter( item => {
      return item.related_skus.includes(searching_for_code)
    })[0]

    if(data === undefined) {
      return false
    }

    if(data.children_product && data.children_product.sku == searching_for_code) {
      return data.children_product
    } else {
      return data
    }

  }

  getName(data) {
    try {
      return data.extension_attributes.gtm_data.product_name_en
    }
    catch {
      return data.name
    }
  }

  getImages(data) {
    if(data.image) {
      return [
        'https://backend.tops.co.th/media/catalog/product' + data.image
      ]
    } else {
      return []
    }
  }
}

export default TopsCoThInfoStore
