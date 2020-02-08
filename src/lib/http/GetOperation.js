import { Operation, HTTPResponse } from './Base'

export default class GetOperation extends Operation {
  resources(req) {
    return {
      resource: this.constructor.model.query().findById(this.args.id)
    }
  }

  requesterCanReadResource(resource) {
    return true
  }

  async execute() {
    if (this.resources.resource == null) {
      return new HTTPResponse({
        status: 404,
        body: {
          message: 'Not Found'
        }
      })
    }

    this.args.include_meta = true

    if (!this.requesterCanReadResource(this.resources.resource)) {
      // yes, we're returning a 404 here, not a 403, as to not leak information
      return new HTTPResponse({
        status: 404,
        body: {
          message: 'Not Found'
        }
      })
    }

    return new HTTPResponse({
      status: 200,
      body: this.toHttpRepresentation(this.resources.resource)
    })
  }
}
