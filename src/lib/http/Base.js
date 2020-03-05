class HTTPResponse {
  constructor({ status, body, headers = {}, ...rest }) {
    this.status = status
    this.headers = headers
    this.body = body

    Object.assign(this, rest)
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

  async run(req) {
    if(!req.user && !this.constructor.canBeCalledAnonymously) {
      return new HTTPResponse({
        status: 401,
        body: {
          message: 'Unauthorized'
        }
      })
    }
    this.user = req.user

    await this.extract_params(req)

    try {
      await this.fetch(this.resources(req))
    } catch (error) {
      console.log(error)
      this.services.logger.warn({
        message: 'Exception thrown while doing a pre-fetch of resoures',
        error: error.toString()
      })

      return new HTTPResponse({
        status: 500,
        body: { message: 'Unhandled error while executing the request' }
      })
    }

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
