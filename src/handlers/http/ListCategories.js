import { Code } from '../../models'
import ListOperation from '../../lib/http/ListOperation'

class ListCategories extends ListOperation {
  static model = Code
  static canBeCalledAnonymously = true

  async extract_params(req) {
    this.args = {
      include_meta: req.query.include_meta,
      limit: req.query.limit,
      offset: req.query.offset,
      parent: req.query.parent || false,
      contains: req.query.contains || false,
    }
  }


  toHttpRepresentation(item) {
    item.path = item.categories
    if(item.categories && item.categories.length > 0) {
      item.categories = item.categories.split('.')
    } else {
      item.categories = []
    }

    item.count = parseInt(item.count)

    return item
  }

  resources(req) {
    return {
      resources: (() => {
        let q = this.constructor.model.query()

        q.select('categories')
        q.count('categories')
        q.groupBy('categories')

        q.options({ 'operationId': this.constructor.name })
        q.whereNotNull('categories')
        q.whereNot('categories', '')

        if(this.args.parent) {
          q.whereRaw('categories <@ \'' + this.args.parent + '\'')
        }

        if(this.args.contains){ 
          q.whereRaw('categories ~ \'*.' + this.args.contains + '.*\'')
        }

        q.skipUndefined()
        q.offset(this.args.offset)
        q.limit(this.args.limit)
        //        q.orderBy(this.args.order[0], this.args.order[1])

        return q
      })()
    }
  }


}

export {
  ListCategories
}
