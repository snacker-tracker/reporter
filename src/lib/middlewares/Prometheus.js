import Middleware from './Middleware'

class Prometheus extends Middleware {
  method = 'get'
  handler(req, res) {
    res.set('Content-Type', this.options.prometheus.register.contentType)
      .send(this.options.prometheus.register.metrics())
  }
}

export default Prometheus
