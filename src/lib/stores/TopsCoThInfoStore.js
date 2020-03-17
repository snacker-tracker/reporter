import ProductInfoStore from './ProductInfoStore'

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

export default TopsCoThInfoStore
