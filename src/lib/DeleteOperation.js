import { Operation, HTTPResponse } from './operation'

export default class DeleteOperation extends Operation {
  requesterCanDeleteResource(item) {
    return true
  }

  resources(req) {
    return {
      resource: (async () => {
        return this.constructor.model.query().findById(this.args.id)
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
      let patch = {
        _deleted_at: now
      }

      if (this.args.sub) {
        patch._deleted_by = this.args.sub
      }

      await this.constructor.model.query()
        .patch(patch)
        .findById(this.resources.resource.id)

      this.resources.resource.deleted = true
      this.resources.resource._deleted_at = now

      this.services.event_publisher.publish(
        [this.constructor.model.name, 'Deleted'].join(''),
        {
          id: this.resources.resource.id
        }
      )

      return new HTTPResponse({
        status: 200,
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
