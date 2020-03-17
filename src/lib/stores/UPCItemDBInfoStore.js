import ProductInfoStore from './ProductInfoStore'

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

  async _get(code) {
    try {
      const response = await this.axios.get(
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

export default UPCItemDBInfoStore
