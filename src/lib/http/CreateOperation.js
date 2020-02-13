import { Operation, HTTPResponse } from './Base'

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

  async execute() {
    this.services.logger.info(this.args)

    let inserted
    try {
      inserted = await this.constructor.model.query()
        .options({ operationId: this.constructor.name })
        .insertAndFetch(this.args.body)
    } catch (error) {
      switch(error.code) {
        case '23505':
          return new HTTPResponse({
            status: 409,
            body: {
              'message': 'Entity already exists or fails a uniqueness constraint'
            }
          })

        default:
          throw error
      }
    }

    this.services.event_publisher.publish(
      [this.constructor.model.name, 'Created'].join(''),
      inserted,
      this.user
    )

    return new HTTPResponse({
      status: 201,
      body: this.toHttpRepresentation(inserted)
    })
  }
}
