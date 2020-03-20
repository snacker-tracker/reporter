import uuid from 'uuid'

import { Operation, HTTPResponse } from './Base'

export default class CreateOperation extends Operation {

  async extract_params(req) {
    this.args = {
      body: {
        id: uuid(),
        ...req.body,
      }
    }
  }

  async execute() {
    this.services.logger.info(this.args)

    let inserted
    try {
      inserted = await this.constructor.model.query()
        .options({ operationId: this.constructor.name })
        .insertAndFetch(this.args.body)
    } catch (error) {
      if(error.code === '23505') {
        return HTTPResponse.Conflict()
      } else {
        throw error
      }
    }

    this.services.event_publisher.publish(
      [this.constructor.model.name, 'Created'].join(''),
      inserted,
      this.user
    )

    return HTTPResponse.Created(this.toHttpRepresentation(inserted))
  }
}
