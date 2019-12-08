import PatchOperation from '../lib/PatchOperation'
import { Code } from '../models'

class PatchCode extends PatchOperation {
  static model = Code

  getId() {
    return this.args.id
  }

  getPatch() {
    return this.args.body
  }

  async extract_params(req) {
    this.args = {
      id: req.params.code,
      body: req.body
    }
  }
}

export { PatchCode }
