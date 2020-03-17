import ProductInfoStore from './ProductInfoStore'

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

export default OpenFoodFactsInfoStore
