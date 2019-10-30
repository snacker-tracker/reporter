import ListOperation from '../lib/ListOperation'
import { Product } from '../models'

class ListScans extends ListOperation {
  static model = Product

  resources(req) {
    let q = this.constructor.model.query()
    q.options({ operationId: this.constructor.name, logger: this.services.logger })
    if (!this.args.include_deleted) {
      q.where({ _deleted_at: null })
    }

    q.skipUndefined()
    q.orderBy('packaging', 'desc')
    q.orderBy('name', 'asc')

    return { resources: q.offset(this.args.offset).limit(this.args.limit) }
  }

  toHttpRepresentation(item) {
    if (item.deleted == false) {
      delete item.deleted
    }

    item.points = parseFloat(item.points)

    if (!this.args.include_meta) {
      delete item.meta
    }

    return item
  }
}

export {
  ListScans
}
