import { Operation, HTTPResponse } from '../lib/operation'
import CreateOperation from '../lib/CreateOperation'

import crypto from 'crypto'

import { Code } from '../models'

import uuid from 'uuid'

class CreateCodePicture extends Operation {
  static model = Code
  static canBeCalledAnonymously = false

  async extract_params(req) {
    const d = new Date().toISOString()
    this.args = {
      body: {
        ...req.params,
        created_at: d,
        updated_at: d
      },
      picture: req.files[0],
      base_url: [
        req.headers['x-forwarded-proto'] || 'http',
        '://',
        req.headers['x-forwarded-host'] || req.headers['host'],
        req.originalUrl
      ].join('')

    }
  }

  async execute() {
    let hash = crypto.createHash('sha256').update(this.args.picture.buffer).digest('hex');

    try {
      await this.services.image_repository.put([this.args.body.code, hash].join('/') + "." + this.args.picture.mimetype.split('/')[1], this.args.picture.buffer)
    } catch(error) {
      console.log(error)
    }

    const picture = {
      id: hash,
      url: this.args.base_url + '/' + hash + '.' + this.args.picture.mimetype.split('/')[1],
      size: this.args.picture.size,
      last_modified: new Date().toISOString()
    }


    this.services.event_publisher.publish(
      ['CodePicture', 'Created'].join(''),
      {
        ...picture,
        code: this.args.body.code
      },
      this.user
    )


    return new HTTPResponse({
      status: 201,
      body: picture
    })
  }

}

export {
  CreateCodePicture
}
