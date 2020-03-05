import ListOperation from '../../lib/http/ListOperation'
import Scan from '../../models/Scan'

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
