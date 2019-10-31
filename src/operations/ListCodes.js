import { Code } from '../models'
import ListOperation from '../lib/ListOperation'

class ListCodes extends ListOperation {
  static model = Code

  toHttpRepresentation(item) {
    return item
  }
}

export {
  ListCodes
}
