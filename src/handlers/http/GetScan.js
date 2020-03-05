import GetOperation from '../../lib/http/GetOperation'
import Scan from '../../models/Scan'

class GetScan extends GetOperation {
  static model = Scan
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    if (item.deleted == false) {
      delete item.deleted
    }

    item.points = parseFloat(item.points)

    if(!this.args.include_meta) {
      delete item.meta
    }

    return item
  }

  async extract_params(req) {
    this.args = {
      id: req.params.productId
    }
  }
}

export { GetScan }
