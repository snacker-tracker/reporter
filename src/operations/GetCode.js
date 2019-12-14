import GetOperation from '../lib/GetOperation'
import { Code } from '../models'

class GetCode extends GetOperation {
  static model = Code
  static canBeCalledAnonymously = true

  async extract_params(req) {
    this.args = {
      id: req.params.code
    }
  }
}

export { GetCode }
