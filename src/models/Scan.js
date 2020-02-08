import { Model } from 'objection'
import connection from '../database/knex'

import Code from './Code'

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

  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    return {
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Code,
        join: {
          from: 'scans.code',
          to: 'codes.code'
        }
      }
    }
  }
}
