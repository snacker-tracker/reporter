import { Operation, HTTPResponse } from '../lib/operation'
import CreateOperation from '../lib/CreateOperation'

import { Scan } from '../models'

import uuid from 'uuid'

class CreateScan extends CreateOperation {
  static model = Scan

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
