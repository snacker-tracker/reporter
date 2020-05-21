import { Model } from 'objection'

export default class Code extends Model {
  static get tableName() {
    return 'codes'
  }

  static get idColumn() {
    return 'code'
  }

  static toHttpRepresentation(item) {
    if(typeof(item.categories) == 'string') {
      item.categories = item.categories.split('.')
    } else {
      item.categories = []
    }

    if(!item.url) {
      delete item.url
    }

    return item
  }

  static insert(code, andFetch = false) {
    if(andFetch) {
      return this.query().insert(code)
    } else {
      return this.query().insertAndFetch(code)
    }
  }
}
