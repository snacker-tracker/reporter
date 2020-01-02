import { Code } from '../models'
import ListOperation from '../lib/ListOperation'

class ListCodes extends ListOperation {
  static model = Code
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    if(item.categories && item.categories.length > 0) {
      item.categories = item.categories.split('.')
    } else {
      item.categories = []
    }

    if(!item.url) {
      delete item.url
    }

    return item
  }

}

export {
  ListCodes
}
