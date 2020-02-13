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
      return new HTTPResponse({
        status: 404,
        body: {
          message: 'Not Found'
        }
      })
    }

    this.args.include_meta = true

    const now = new Date().toISOString()

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

      return new HTTPResponse({
        status: 201,
        body: this.toHttpRepresentation(this.resources.resource)
      })

    } else {
      return new HTTPResponse({
        status: 403,
        body: this.toHttpRepresentation(this.resources.resource)
      })
    }
  }
}
