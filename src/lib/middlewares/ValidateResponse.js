import logger from '../../lib/logger'
import Metrics from '../../lib/metrics'

const ValidateResponse = (req, res, next) => {
  if (typeof res.validateResponse === 'function') {
    const send = res.send
    res.send = function expressOpenAPISend(...args) {
      const body = args[0] || '{}'
      let validation = res.validateResponse(res.statusCode, JSON.parse(body))

      let errors = []

      if(validation) {
        if(validation.errors != null) {
          errors = validation.errors
        }

        if(errors.length > 0) {
          const message = {
            request_id: req.request_id,
            message: 'response is invalid',
            errors: errors
          }

          if(req.correlation_id) {
            message.correlation_id = req.correlation_id
          }

          logger.warn(message)
        }
      }

      res.set('X-Swagger-Response-Valid', errors.length == 0)
      res.set('X-Swagger-Response-Error-Count', errors.length)

      Metrics.swagger_invalid_responses.labels( req.operationDoc.operationId || 'unknown', res.statusCode || 'unknown').observe(errors.length != 0 ? 1 : 0)
      Metrics.swagger_response_errors.labels( req.operationDoc.operationid || 'unknown', res.statusCode || 'unknown').observe(errors.length)

      return send.apply(res, args)
    }
  }

  next()
}

export default ValidateResponse
