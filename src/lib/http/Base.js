class HTTPResponse {
  constructor({ status, body, headers = {}, ...rest }) {
    this.status = status
    this.headers = headers
    this.body = body

    Object.assign(this, rest)
  }

  static ServerError(message) {
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

  static Error(status, message) {
    return new this({
      status,
      body: {
        message
      }
    })
  }

  static Created(body, headers = {}) {
    return this.OkBase(201, body, headers)
  }

  static Okay(body, headers = {}) {
    return this.OkBase(200, body, headers)
  }

  static OkBase(status, body, headers = {}) {
    return new this({
      status,
      body,
      headers
    })
  }
}

class Operation {
  constructor(services = {}) {
    this.services = services
  }

  static canBeCalledAnonymously = true

  async extract_params() {
    this.args = {}
  }

  toHttpRepresentation(item) {
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

  AuthN(req) {
    if(this.services.config) {
      if(this.services.config.auth.authn.enabled) {
        this.user = req.user
      } else {
        this.user = false
      }

      return (req.user == false || req.user == null) && this.constructor.canBeCalledAnonymously == false
    }
  }

  AuthZ(req) {
    if(req.user && !this.constructor.canBeCalledAnonymously) {
      this.services.logger.info('hello')
      const perms = req.user.permissions
        .map( p => p.split(':') )
        .filter( p => p[0] == this.services.config.oauth.audience )
        .map( p => p[1] )

      if(!perms.includes(this.constructor.name)) {
        return true
      }
    }

    return false
  }

  response(code, message) {
    return new HTTPResponse({
      status: code,
      body: {
        message
      }
    })
  }

  async prefetch(req) {
    try {
      await this.fetch(this.resources(req))
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

  async run(req) {
    if(this.AuthN(req)) {
      return this.response(401, 'Unauthorized')
    }

    if(this.AuthZ(req)) {
      return new HTTPResponse({
        status: 403,
        body: {
          message: 'Forbidden: You can\' do this'
        }
      })
    }

    await this.extract_params(req)

    if(await this.prefetch(req)) {
      return this.response(500, 'Unhandled error while doing a pre-fetch of resources')
    }

    return await this.tryExecute()
  }

  async fetch(hash_of_promises) {
    for (let [key, promise] of Object.entries(await hash_of_promises)) {
      const response = await promise
      this.resources[key] = response
    }
  }
}

export {
  HTTPResponse,
  Operation
}
