import GetOperation from '../../lib/http/GetOperation'
import Code from '../../models/Code'

class GetCode extends GetOperation {
  static model = Code
  static canBeCalledAnonymously = true

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
      id: req.params.code
    }
  }
}

export { GetCode }
