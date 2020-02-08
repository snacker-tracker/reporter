import { Code } from '../../models'
import ListOperation from '../../lib/http/ListOperation'

class ListCodes extends ListOperation {
  static model = Code
  static canBeCalledAnonymously = true

  async extract_params(req) {
    this.args = {
      include_deleted: req.query.include_deleted,
      include_meta: req.query.include_meta,
      limit: req.query.limit,
      offset: req.query.offset,
      order: this.constructor.model.order || ['created_at', 'desc'],
      categories: req.query.categories
    }
  }


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

  resources(req) {
    return {
      resources: (() => {
        let q = this.constructor.model.query()

        q.options({ 'operationId': this.constructor.name })
        if (this.constructor.model.hasDeletion && !this.args.include_deleted) {
          q.where({ '_deleted_at': null })
        }

        if(this.args.categories) {
          q.whereRaw('categories ~ \'*.' + this.args.categories + '.*\'')
        }

        q.skipUndefined()
        q.offset(this.args.offset)
        q.limit(this.args.limit)
        q.orderBy(this.args.order[0], this.args.order[1])

        return q
      })()
    }
  }


}

export {
  ListCodes
}
