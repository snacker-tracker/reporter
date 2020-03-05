import ListOperation from '../../lib/http/GetOperation'
import { HTTPResponse } from '../../lib/http/Base'
import Code from '../../models/Code'

class ListCodePictures extends ListOperation {
  static model = Code
  static canBeCalledAnonymously = true

  async extract_params(req) {
    this.args = {
      id: req.params.code,
      base_url: [
        req.headers['x-forwarded-proto'] || 'http',
        '://',
        req.headers['x-forwarded-host'] || req.headers['host'],
        req.originalUrl
      ].join('')
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

    const list = await this.services.image_repository.list(this.args.id)

    return new HTTPResponse({
      status: 200,
      body: {
        items: list.Contents.map((image) => { return this.toHttpRepresentation.apply(this,[image])}),
        pagination: {}
      }
    })
  }

  toHttpRepresentation(image) {
    return {
      id: image.Key.split('/')[1].split('.')[0],
      //url: this.args.base_url + '/' + image.Key.split('/')[1],
      url: this.services.image_repository.presign(image.Key),
      size: image.Size,
      last_modified: image.LastModified
    }
  }

}

export { ListCodePictures }
