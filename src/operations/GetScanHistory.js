import ListOperation from '../lib/ListOperation'
import { Scan } from '../models'

class ListScans extends ListOperation {
  static model = Scan
  static hasDeletion = false
  static canBeCalledAnonymously = true

  static intervals = [
    'daily',
    'hourly',
    'weekly'
  ]

  extract_params(req, res) {
    this.args = {
      code: req.query.code,
      from_date: req.query.from_date,
      to_date: req.query.to_date,
      interval: '1 day'
    }
  }

  async execute() {
    const q = this.constructor.model.query()

    q.select('code', '')
  }

}

export {
  ListScans
}
