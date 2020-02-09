import logger from '../logger'

import Metrics from '../metrics'

const AccessLogs = (req, res, next) => {
  req._startTime = new Date()
  let end = res.end

  res.end = function (chunk, encoding) {
    let event = {
      request: {},
      response: {}
    }

    res.responseTime = new Date() - req._startTime

    event.request_id = req.request_id
    if (req.correlation_id) {
      event.correlation_id = req.correlation_id
    }

    event.request.verb = req.method
    event.request.uri = req.originalUrl || req.url

    if (req.route) {
      event.request.route = req.route.path
    }

    if (req.operationDoc) {
      event.swagger = {
        operationId: req.operationDoc.operationId,
        input: {
          ...req.query,
          ...req.params
        }
      }

      if(req.body) {
        event.swagger.input.body = req.body
      }
    }

    if (req.user) {
      event.request.user = {
        ...req.user
      }
    }

    if (req.query) {
      event.request.query = req.query
    }

    /*
    if( Object.keys(req.files).length > 0 ) {
      event.request.files = {}
      Object.keys(req.files).forEach((i) => {
        event.request.files[i] = {
          filename: req.files[i].filename,
          originalname: req.files[i].originalname,
          encoding: req.files[i].encoding,
          mimetype: req.files[i].mimetype,
          path: req.files[i].path,
          size: req.files[i].size,
          truncated: req.files[i].truncated
        }
      })
    }
    */

    event.request.headers = {}
    Object.keys(req.headers).forEach(header => {
      let key = header.replace(/-/g, '_')
      let value = req.headers[header]
      if (key == 'content_type') {
        if (value.includes('boundary')) {
          value = value.split(';')[0]
        }
      }
      //if it's not authenticated user, we just capture the failed tokens just to not lose any logs
      if (!(req.user && ['authorization'].includes(key))) {
        event.request.headers[key] = value
      }
    })

    if ('content_type' in event.request.headers) {
      if (
        event.request.headers['content_type'] &&
        event.request.headers['content_type'].includes('application/json')
      ) {
        event.request.body = req.body
      }
    }

    let responseHeaders = res.getHeaders()

    event.response.headers = {}
    Object.keys(responseHeaders).forEach(header => {
      let key = header.replace(/-/g, '_')
      let value = responseHeaders[header]
      if (key == 'content_type') {
        if (value.includes('boundary')) {
          value = value.split(';')[0]
        }
      }

      if (!['x_powered_by'].includes(key)) {
        event.response.headers[key] = value
      }
    })

    if ('statusCode' in res) {
      event.response.status = `${res.statusCode}`
    }

    // Nginx timings might be in seconds, keeping it consistent
    event.timing = {
      response: res.responseTime / 1000
    }

    res.end = end
    res.end(chunk, encoding)

    logger.info({
      type: 'nodejs-access-logs',
      ...event
    })

    if (req.operationDoc) {
      Metrics.swagger_operation_time_spent.labels(
        req.operationDoc.operationId,
        event.response.status
      ).observe(event.timing.response)

      if(req.headers['user-agent']) {
        let user_agent = 'browser'
        let user_agent_version = 'unknown'
        // 42, beccause it's the answer to  life, the universe, and everything
        if(req.headers['user-agent'].length < 42) {
          const split = req.headers['user-agent'].split('/')

          if(split.length == 2) {
            user_agent = req.headers['user-agent'].split('/')[0]
            user_agent_version = req.headers['user-agent'].split('/')[1]
          }
        }

        Metrics.api_user_agents.labels(
          user_agent,
          user_agent_version
        ).inc()
      }
    }

  }

  next()
}

export default AccessLogs
