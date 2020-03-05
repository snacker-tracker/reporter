import Middleware from './Middleware'

class ValidateResponse extends Middleware {
  validate(req, res) {
    if(res.validateResponse) {
      // Because magic happens; dates get formatted using ISO8???
      let body
      try {
        body = JSON.parse(JSON.stringify(res.locals.response))
      } catch(error) {
        this.options.logger({ message: 'cannot validate invalid json' })
        this.options.metrics.swagger
          .response_errors
          .labels(log_event.operationId, res.statusCode)
          .observe(1)
        return
      }

      const log_event = {
        errors: [],
        operationId: req.operationDoc.operationId
      }

      if(req.request_id) {
        log_event.request_id = req.request_id
      }

      if(req.correlation_id) {
        log_event.correlation_id = req.correlation_id
      }

      const errors = res.validateResponse(res.statusCode, body)

      if(errors) {
        log_event.message = 'response is invalid'
        log_event.operationId = req.operationDoc.operationId
        log_event.errors = errors.errors

        this.options.logger.info(log_event)
      }

      this.options.metrics.swagger
        .response_errors
        .labels(log_event.operationId, res.statusCode)
        .observe(log_event.errors.length)


      if(this.options.config.swagger.validateResponsesSynchronously &&
        this.options.config.swagger.exposeResponseValidationResult) {
        res.set({
          'X-Swagger-Response-Valid': log_event.errors.length === 0,
          'X-Swagger-Response-Error-Count': log_event.errors.length
        })
      }
    }


  }

  handler(req, res, next) {
    const self = this
    const original = res.json.bind(res)

    const validateSynchronously = this.options.config.swagger.validation.sync || false

    const overwrite = function(object) {
      res.locals = { response: object }
      if(validateSynchronously) {
        self.validate(res.req, res)
      }
      original(object)
    }

    res.json = overwrite.bind(this)

    if(!validateSynchronously) {
      res.on('finish', () => {
        this.validate(res.req, res)
      })
    }

    next()
  }
}

export default ValidateResponse
