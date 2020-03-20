import { Operation, HTTPResponse } from './Base'

export default class DeleteOperation extends Operation {
  requesterCanDeleteResource() {
    return true
  }

  extract_params(req) {
    this.args = {
      id: req.params.id
    }
  }

  resources() {
    return {
      resource: (async () => {
        return this.constructor.model.query().findById(this.args.id).options({ operationId: this.constructor.name })
      })()
    }
  }

  async execute() {
    if (this.resources.resource == null) {
      return HTTPResponse.NotFound()
    }

    this.args.include_meta = true

    if (this.requesterCanDeleteResource(this.resources.resource)) {
      await this.constructor.model.query()
        .deleteById(this.resources.resource.id)

      this.services.event_publisher.publish(
        [this.constructor.model.name, 'Deleted'].join(''),
        {
          id: this.resources.resource.id
        },
        this.user
      )

      return HTTPResponse.Created(this.toHttpRepresentation(this.resources.resource))
    } else {
      return HTTPResponse.Forbidden(this.toHttpRepresentation(this.resources.resource))
    }
  }
}
