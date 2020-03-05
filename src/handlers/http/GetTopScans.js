import ListOperation from '../../lib/http/ListOperation'
import Scan from '../../models/Scan'

class GetTopScans extends ListOperation {
  static model = Scan
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    item.count = parseInt(item.count)
    return item
  }

  extract_params(req) {
    this.args = {
      from_date: req.query.from_date || false,
      to_date: req.query.to_date || false,
      offset: req.query.offset,
      limit: req.query.limit,
    }
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
        query.orderBy('count', 'desc')

        if(this.args.from_date) {
          query.where('scanned_at', '>=', this.args.from_date)
        }

        if(this.args.to_date) {
          query.where('scanned_at', '<=', this.args.from_date)
        }

        query.offset(this.args.offset)
        query.limit(this.args.limit)


        return query
      })()
    }
  }
}

export { GetTopScans }
