import { Operation, HTTPResponse } from './Base'

export default class PatchOperation extends Operation {

  async extract_params(req) {
    this.args = {
      body: req.body,
      params: req.params
    }
  }

  getId() {
    return this.args.params.id
  }

  getPatch() {
    return this.args.body
  }

  async execute() {
    this.services.logger.info(this.args)

    let patch = this.getPatch()

    const result = await this.constructor.model.query().patchAndFetchById(
      this.getId(),
      patch
    ).options({ operationId: this.constructor.name })

    this.services.event_publisher.publish(
      [this.constructor.model.name, 'Patched'].join(''),
      {
        id: this.getId(),
        code: this.getId(),
        ...patch,
      }
    )

    return new HTTPResponse({
      status: 201,
      body: this.toHttpRepresentation(result)
    })
  }
}
