import ListOperation from '../lib/GetOperation'
import { Scan } from '../models'

class GetTopScans extends ListOperation {
  static model = Scan
  toHttpRepresentation(item) {
    item.count = parseInt(item.count)
    return item
  }

  async resources() {
    let q = this.constructor.model.query()
    q.options({operationId: this.constructor.name})

    q.select('code')
    q.min('scanned_at as first_scan')
    q.max('scanned_at as last_scan')
    q.count('code').groupBy('code')
    q.eager('product')
    q.orderBy('count', 'desc')

    return {
      resource: q
    }
  }

  async extract_params(req) {
    this.args = {
      id: req.params.productId
    }
  }
}

export { GetTopScans }
