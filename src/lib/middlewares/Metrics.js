import promBundle from 'express-prom-bundle'

import Middleware from './Middleware'

class Prometheus extends Middleware {
  method = 'get'
  handler(req, res, next) {
    res.set('Content-Type', this.options.prometheus.register.contentType)
      .send(this.options.prometheus.register.metrics())
  }
}

export default Prometheus
