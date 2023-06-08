import { Response, NextFunction } from "express"
import { OpenAPI } from "openapi-types"

type ExtendedRequest = OpenAPI.Request & {
    user?: any,
    auth?: any
}

type HTTPStatus = 200 | 201 | 202 | 204 | 301 | 302 | 304 | 400 | 401 | 403 | 404 | 405 | 409 | 410 | 422 | 500 | 501

type HTTPHeaders = {
    [key: string]: string
}

class HTTPResponse {
  status: HTTPStatus
  headers: HTTPHeaders
  body: object

  constructor(args: {
      status: HTTPStatus,
      body: object,
      headers?: HTTPHeaders,
  }) {
    this.status = args.status,
    this.headers = args.headers
    this.body = args.body
  }

  static ServerError(message: string = "Server Error") {
    return this.Error(500, message)
  }

  static NotFound(message = 'Not Found') {
    return this.Error(404, message)
  }

  static Forbidden(message = 'You may not be allowed to do this') {
    return this.Error(403, message)
  }

  static Conflict(message = 'Entity already exists of fails a uniqueness constraint') {
    return this.Error(409, message)
  }

  static Error(status: HTTPStatus, message: string) {
    return new this({
      status,
      body: {
        message
      }
    })
  }

  static Created(body: object, headers = {}) {
    return this.OkBase(201, body, headers)
  }

  static Okay(body: object, headers: HTTPHeaders = {}) {
    return this.OkBase(200, body, headers)
  }

  static OkBase(status: HTTPStatus, body: object = {}, headers: HTTPHeaders = {}) {
    return new this({
      status,
      body,
      headers
    })
  }
}

class Operation {
  services: { [key: string]: any }
  args: {}
  user: {}
  //resources: Promise<{[key: string]: Promise<any> }>

  constructor(services = {}) {
    this.services = services
  }

  static canBeCalledAnonymously: boolean = true

  async extract_params(req: ExtendedRequest) {
    this.args = {}
  }

  toHttpRepresentation(item: {}) {
    return item
  }

  async execute() {
    return new HTTPResponse({
      status: 501,
      body: {
        message: 'Not Implemented'
      }
    })
  }

  async resources() {
    return {}
  }

  AuthN(req: ExtendedRequest) {
    if(this.services.config) {
      if(this.services.config.auth.authn.enabled) {
        this.user = req.user
      } else {
        this.user = false
      }

      return (req.auth == false || req.auth == null) && (this.constructor as typeof Operation ).canBeCalledAnonymously == false
    }
  }

  AuthZ(req: ExtendedRequest) {
    if(req.user && !(this.constructor as typeof Operation).canBeCalledAnonymously) {
      this.services.logger.info('hello')
      const perms = req.auth.permissions
        .map( perm => perm.split(':') )
        .filter( perm => perm[0] == this.services.config.oauth.audience )
        .map( perm => perm[1] )

      if(!perms.includes(this.constructor.name)) {
        return true
      }
    }

    return false
  }

  response(code: HTTPStatus, message: string) {
    return new HTTPResponse({
      status: code,
      body: {
        message
      }
    })
  }

  async fetch(hash_of_promises: Promise<{ [key: string]: Promise<any> }> ) {
    for (let [key, promise] of Object.entries(await hash_of_promises)) {
      const response = await promise
      this.resources[key] = response
    }
  }

  async prefetch(req: ExtendedRequest) {
    try {
      await this.fetch(this.resources())
    } catch (error) {
      if(this.services.logger) {
        this.services.logger.warn({
          message: 'Exception thrown while doing a pre-fetch of resoures',
          error: error.toString()
        })
      }

      return new HTTPResponse({
        status: 500,
        body: { message: 'Unhandled error while executing the request' }
      })
    }
  }

  async tryExecute() {
    try {
      return await this.execute()
    } catch (error) {
      this.services.logger.warn({
        message: 'Exception thrown while doing a executing the request',
        error: error.toString()
      })
      return new HTTPResponse({
        status: 500,
        body: { message: 'Unhandled error while executing the request' }
      })
    }
  }

  async run(req: Request): Promise<HTTPResponse> {
    if(this.AuthN(req)) {
      return this.response(401, 'Unauthorized')
    }

    if(this.AuthZ(req)) {
      return new HTTPResponse({
        status: 403,
        body: {
          message: 'Forbidden: You can\'t do this'
        }
      })
    }

    await this.extract_params(req)

    if(await this.prefetch(req)) {
      return this.response(500, 'Unhandled error while doing a pre-fetch of resources')
    }

    return await this.tryExecute()
  }

}

export {
  HTTPResponse,
  Operation
}
