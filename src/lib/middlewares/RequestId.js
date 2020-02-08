import uuid from 'uuid'

const RequestId = (req, res, next) => {
  req.request_id = req.headers['request-id'] || req.headers['request_id'] || uuid()
  req.correlation_id = req.headers['correlation-id'] || req.headers['correlation-id'] || null

  next()
}
export default RequestId
