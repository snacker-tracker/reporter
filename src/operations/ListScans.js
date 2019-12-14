import ListOperation from '../lib/ListOperation'
import { Scan } from '../models'

class ListScans extends ListOperation {
  static model = Scan
  static hasDeletion = false
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    return item
  }
}

export {
  ListScans
}
