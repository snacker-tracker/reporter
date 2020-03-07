import CreateOperation from '../../lib/http/CreateOperation'

import Code from '../..//models/Code'

class CreateCode extends CreateOperation {
  static model = Code
  static canBeCalledAnonymously = false

  toHttpRepresentation = Code.toHttpRepresentation

  async extract_params(req) {
    const now = new Date().toISOString()

    this.args = {
      body: {
        ...req.body,
        created_at: now,
        updated_at: now,
        categories: (req.body.categories || []).map( category => {
          return category.replace(/-/g, '_').replace(/ /g, '_')
        }).join('.')
      }
    }
  }

}

export {
  CreateCode
}
