import DeleteOperation from '../../lib/http/DeleteOperation'

import Scan from '../../models/Scan'

class DeleteScan extends DeleteOperation {
  static model = Scan
  static canBeCalledAnonymously = false

  extract_params(req) {
    this.args = {
      sub: req.user.sub,
      id: req.params.productId
    }
  }

}

export { DeleteScan }
