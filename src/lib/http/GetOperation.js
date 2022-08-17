import { Operation, HTTPResponse } from './Base'

export default class GetOperation extends Operation {
  resources() {
    return {
      resource: this.constructor.model.query().options({
        'operationId': this.constructor.name,
        logger: this.services.logger
      }).findById(this.args.id)
    }
  }

  requesterCanReadResource() {
    return true
  }

  async execute() {
    if (this.resources.resource == null) {
      return HTTPResponse.NotFound()
    }

    this.args.include_meta = true

    if (!this.requesterCanReadResource(this.resources.resource)) {
      // yes, we're returning a 404 here, not a 403, as to not leak information
      return HTTPResponse.NotFound()
    }

    return HTTPResponse.Okay(this.toHttpRepresentation(this.resources.resource))
  }
}
