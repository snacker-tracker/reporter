import { Model } from 'objection'
import connection from '../database/knex'

import uuid from 'uuid'

Model.knex(connection)

export default class Code extends Model {
  static get tableName() {
    return 'codes'
  }

  static get idColumn() {
    return 'code'
  }

  static insert(code, andFetch = false) {
    if(andFetch) {
      return this.query().insert(code)
    } else {
      return this.query().insertAndFetch(code)
    }
  }
}
