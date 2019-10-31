import { Operation, HTTPResponse } from './operation'

export default class ListOperation extends Operation {
  async extract_params(req) {
    this.args = {
      include_deleted: req.query.include_deleted,
      include_meta: req.query.include_meta,
      limit: req.query.limit,
      offset: req.query.offset
    }
  }

  resources(req) {
    return {
      resources: (() => {
        let q = this.constructor.model.query()

        q.options({ 'operationId': this.constructor.name })
        if (this.constructor.model.hasDeletion && !this.args.include_deleted) {
          q.where({ '_deleted_at': null })
        }

        q.skipUndefined()
        q.offset(this.args.offset)
        q.limit(this.args.limit)
        //q.orderBy('recorded_at', 'asc')

        return q
      })()
    }
  }

  async execute() {
    const resources = await this.resources

    return new HTTPResponse({
      status: 200,
      body: {
        pagination: {},
        items: this.resources.resources.map(i => { return this.toHttpRepresentation(i) })
      }
    })
  }
}
