import uuid from 'uuid'

import Middleware from './Middleware'

class RequestId extends Middleware {
  requestId(req) {
    return req.headers['request-id'] || req.headers['request_id'] || uuid()
  }

  correlationId(req) {
    return req.headers['correlation-id'] || req.headers['correlation_id'] || req.request_id
  }

  handler(req, res, next) {
    req.request_id = this.requestId(req)
    req.correlation_id = this.correlationId(req)
    next()
  }
}

export default RequestId
