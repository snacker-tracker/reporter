import Middleware from './Middleware'

class AccessLogs extends Middleware {
  objectEntriesReducer( accumulator, current ) {
    accumulator[current[0]] = current[1]
    return accumulator
  }

  mapHeader([key, value]) {
    return [
      key.replace(/-/g, '_'),
      value
    ]
  }

  mapKeysAndValues(object, fn) {
    return Object.entries(object)
      .map(fn)
      .reduce(this.objectEntriesReducer, {})
  }

  log(res) {
    const event = {
      request: {
        method: res.req.method,
        url: res.req.url,
        headers: this.mapKeysAndValues(res.req.headers, this.mapHeader)
      },
      response: {
        status: res.statusCode,
        headers: this.mapKeysAndValues(res.getHeaders(), this.mapHeader)
      },
      time_spent: (new Date() - res.req.locals.startTime) / 1000

    }

    if(event.request.headers.authorization) {
      event.request.headers.authorization = "REDACTED"
    }

    if(res.req.user) {
      event.request.user = res.req.user
    }

    this.options.logger.info(event)

    if(res.req.operationDoc && res.req.operationDoc.operationId) {
      this.options.metrics.swagger.time_spent.labels(
        res.req.operationDoc.operationId,
        res.statusCode
      ).observe(
        (new Date() - res.req.locals.startTime) / 1000
      )
    }
  }

  handler(req, res, next) {
    const self = this
    res.on('finish', function() {
      self.log(this)
    })

    next()
  }
}

export default AccessLogs
