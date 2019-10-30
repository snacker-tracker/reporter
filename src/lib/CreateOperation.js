import { Operation, HTTPResponse } from './operation'

import uuid from 'uuid'
//import Scan from '../models/QRCodeScan'

export default class CreateOperation extends Operation {

  async extract_params(req) {
    this.args = {
      body: {
        id: uuid(),
        ...req.body,
      }
    }
  }

  requesterCanCreateResource(item) {
    return true
  }

  async execute() {
    this.services.logger.info(this.args)

    const inserted = await this.constructor.model.insert({
      ...this.args.body,
    }, true).options({ operationId: this.constructor.name })

    this.services.event_publisher.publish(
      [this.constructor.model.name, 'Created'].join(''),
      inserted
    )

    return new HTTPResponse({
      status: 201,
      body: this.toHttpRepresentation(inserted)
    })
  }
}
