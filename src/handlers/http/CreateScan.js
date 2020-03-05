import CreateOperation from '../../lib/http/CreateOperation'

import Scan from '../../models/Scan'

import uuid from 'uuid'

class CreateScan extends CreateOperation {
  static model = Scan
  static canBeCalledAnonymously = true

  async extract_params(req) {
    const now = new Date().toISOString()

    this.args = {
      body: {
        ...req.body,
        id: uuid(),
        scanned_at: req.body.scanned_at || now,
        created_at: now
      }
    }
  }
}

export {
  CreateScan
}
