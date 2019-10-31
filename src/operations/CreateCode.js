import { Operation, HTTPResponse } from '../lib/operation'
import CreateOperation from '../lib/CreateOperation'

import { Code } from '../models'

import uuid from 'uuid'

class CreateCode extends CreateOperation {
  static model = Code

  async extract_params(req) {
    const d = new Date().toISOString()

    this.args = {
      body: {
        ...req.body,
        created_at: d,
        updated_at: d
      }
    }
  }

}

export {
  CreateCode
}
