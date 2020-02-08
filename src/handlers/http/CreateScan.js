import { Operation, HTTPResponse } from '../../lib/http/Base'
import CreateOperation from '../../lib/http/CreateOperation'

import { Scan } from '../../models'

import uuid from 'uuid'

class CreateScan extends CreateOperation {
  static model = Scan
  static canBeCalledAnonymously = true

  async extract_params(req) {
    const d = new Date().toISOString()

    this.args = {
      body: {
        ...req.body,
        id: uuid(),
        scanned_at: req.body.scanned_at || d,
        created_at: d
      }
    }
  }
}

export {
  CreateScan
}
