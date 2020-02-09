import CreateOperation from '../../lib/http/CreateOperation'

import { Code } from '../../models'

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
    const now = new Date().toISOString()

    this.args = {
      body: {
        ...req.body,
        created_at: now,
        updated_at: now,
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
