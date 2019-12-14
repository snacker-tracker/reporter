import DeleteOperation from '../lib/DeleteOperation'

import { Product } from '../models'

class DeleteScan extends DeleteOperation {
  static model = Product
  static canBeCalledAnonymously = false

  extract_params(req) {
    this.args = {
      sub: req.user.sub,
      id: req.params.productId
    }
  }

}

export { DeleteScan }
