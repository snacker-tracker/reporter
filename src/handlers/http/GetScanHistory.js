import ListOperation from '../../lib/http/ListOperation'
import { Scan } from '../../models'

class ListScans extends ListOperation {
  static model = Scan
  static hasDeletion = false
  static canBeCalledAnonymously = true

  static intervals = [
    'daily',
    'hourly',
    'weekly'
  ]

  extract_params(req) {
    this.args = {
      code: req.query.code,
      from_date: req.query.from_date,
      to_date: req.query.to_date,
      interval: '1 day'
    }
  }

  async execute() {
    const query = this.constructor.model.query()

    query.select('code', '')
  }

}

export {
  ListScans
}
