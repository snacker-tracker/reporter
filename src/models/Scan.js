import { Model } from 'objection'
import connection from '../database/knex'

import uuid from 'uuid'

Model.knex(connection)

export default class Scan extends Model {
  static get tableName() {
    return 'scans'
  }

  static insert(scan, andFetch = false) {
    if(andFetch) {
      return this.query().insert(scan)
    } else {
      return this.query().insertAndFetch(scan)
    }
  }
}
