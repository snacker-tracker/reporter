import { Operation, HTTPResponse } from './Base'

export default class ListOperation extends Operation {
  async extract_params(req) {
    this.args = {
      include_deleted: req.query.include_deleted,
      include_meta: req.query.include_meta,
      limit: req.query.limit,
      offset: req.query.offset,
      order: this.constructor.model.order || ['created_at', 'desc']
    }
  }

  resources() {
    return {
      resources: (() => {
        let query = this.constructor.model.query()

        query.options({ 'operationId': this.constructor.name })
        if (this.constructor.model.hasDeletion && !this.args.include_deleted) {
          query.where({ '_deleted_at': null })
        }

        query.skipUndefined()
        query.offset(this.args.offset)
        query.limit(this.args.limit)
        query.orderBy(this.args.order[0], this.args.order[1])

        return query
      })()
    }
  }

  async execute() {
    return new HTTPResponse({
      status: 200,
      body: {
        pagination: {},
        items: this.resources.resources.map(item => { return this.toHttpRepresentation(item) })
      }
    })
  }
}
