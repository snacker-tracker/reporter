import ProductInfoStore from './ProductInfoStore'

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

export default BigCInfoStore
