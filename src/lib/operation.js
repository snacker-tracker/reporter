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

  async getUserInfo(req) {
    const authorization = req.headers.authorization
    if (!this.userInfo) {
      return await this.services.auth0.getUserInfo(authorization)
    } else {
      return this.userInfo
    }
  }

  async extract_params(req) {
    this.args = {}
  }

  toHttpRepresentation(item) {
    if (item.deleted == false) {
      delete item.deleted
    }

    if (!this.args.include_meta) {
      //item = this.reformatMetadata(item)
      delete item.meta
    }

    return item
  }

  reformatMetadata(item) {
    item.meta = {}
    if (item._created_at) {
      item.meta.created = {
        at: item._created_at.toISOString(),
        by: item._created_by || 'unknown'
      }
    }

    if (item._updated_at) {
      item.meta.updated = {
        at: item._updated_at.toISOString(),
        by: item._updated_by || 'unknown'
      }
    }

    if (item._deleted_at) {
      item.meta.deleted = {
        at: item._deleted_at.toISOString(),
        by: item._deleted_by || 'unknown'
      }
    }


    return item

  }


  async execute(req, res) {
    return new HTTPResponse({
      status: 501,
      body: {
        message: 'Not Implemented'
      }
    })
  }

  async resources(req) {
    return {}
  }

  async run(req, res) {
    await this.extract_params(req)
    try {
      await this.fetch(this.resources(req))
    } catch (error) {
      console.log('err', error)
      this.services.logger.warn({
        message: 'Exception thrown while doing a pre-fetch of resoures',
        error
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
        error
      })
      console.log(error)
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
