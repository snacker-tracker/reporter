import Code from '../../models/Code'
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

  resources() {
    return {
      resources: (() => {
        let query = this.constructor.model.query()

        query.select('categories')
        query.count('categories')
        query.groupBy('categories')

        query.options({ 'operationId': this.constructor.name })
        query.whereNotNull('categories')
        query.whereNot('categories', '')

        if(this.args.parent) {
          query.whereRaw('categories <@ \'' + this.args.parent + '\'')
        }

        if(this.args.contains){ 
          query.whereRaw('categories ~ \'*.' + this.args.contains + '.*\'')
        }

        query.skipUndefined()
        query.offset(this.args.offset)
        query.limit(this.args.limit)
        //        q.orderBy(this.args.order[0], this.args.order[1])

        return query
      })()
    }
  }
}

export {
  ListCategories
}
