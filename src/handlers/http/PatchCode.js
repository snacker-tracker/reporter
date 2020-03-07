import PatchOperation from '../../lib/http/PatchOperation'
import Code from '../../models/Code'

class PatchCode extends PatchOperation {
  static model = Code
  static canBeCalledAnonymously = true

  getId() {
    return this.args.id
  }

  getPatch() {
    return this.args.body
  }

  toHttpRepresentation = Code.toHttpRepresentation

  async extract_params(req) {
    this.args = {
      id: req.params.code,
      body: {
        ...req.body,
        categories: (req.body.categories || []).join('.')
      }
    }
  }
}

export { PatchCode }
