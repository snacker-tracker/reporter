import ListOperation from '../lib/ListOperation'
import { Scan } from '../models'

class GetTopScans extends ListOperation {
  static model = Scan
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    item.count = parseInt(item.count)
    return item
  }

  resources() {
    return {
      resources: (() => {
        let query = this.constructor.model.query()
        query.options({ operationId: this.constructor.name })

        query.select('code')
        query.min('scanned_at as first_scan')
        query.max('scanned_at as last_scan')
        query.count('code').groupBy('code')
        //query.eager('product')
        query.orderBy('count', 'desc')

        return query
      })()
    }
  }
}

export { GetTopScans }
