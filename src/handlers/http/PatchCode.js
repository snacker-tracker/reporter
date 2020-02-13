import PatchOperation from '../../lib/http/PatchOperation'
import { Code } from '../../models'

class PatchCode extends PatchOperation {
  static model = Code
  static canBeCalledAnonymously = true

  getId() {
    return this.args.id
  }

  getPatch() {
    return this.args.body
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

  async extract_params(req) {
    this.args = {
      id: req.params.code,
      body: {
        ...req.body,
        categories: (req.body.categories || []).join('.')
      }
    }
  }
}

export { PatchCode }
