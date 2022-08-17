import DeleteOperation from '../../lib/http/DeleteOperation'

import Scan from '../../models/Scan'

class DeleteScan extends DeleteOperation {
  static model = Scan
  static canBeCalledAnonymously = true

  extract_params(req) {
    const user = req.user

    this.args = {
      ...(user && 'sub' in user ? { sub: user.sub } : {}),
      id: req.params.scanId
    }
  }

}

export { DeleteScan }
