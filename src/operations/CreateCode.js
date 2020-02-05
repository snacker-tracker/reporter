import { Operation, HTTPResponse } from '../lib/operation'
import CreateOperation from '../lib/CreateOperation'

import { Code } from '../models'

class CreateCode extends CreateOperation {
  static model = Code
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    if(item.categories && item.categories.length > 0) {
      item.categories = item.categories.split('.')
    } else {
      item.categories = []
    }

    return item
  }

  async extract_params(req) {
    const d = new Date().toISOString()

    this.args = {
      body: {
        ...req.body,
        created_at: d,
        updated_at: d,
        categories: (req.body.categories || []).map( category => {
          return category.replace(/-/g, '_').replace(/ /g, '_')
        }).join('.')
      }
    }
  }

}

export {
  CreateCode
}
