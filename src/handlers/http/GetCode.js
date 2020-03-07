import GetOperation from '../../lib/http/GetOperation'
import Code from '../../models/Code'

class GetCode extends GetOperation {
  static model = Code
  static canBeCalledAnonymously = true

  toHttpRepresentation = Code.toHttpRepresentation

  async extract_params(req) {
    this.args = {
      id: req.params.code
    }
  }
}

export { GetCode }
