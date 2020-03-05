import Middleware from './Middleware'

class SwaggerDoc extends Middleware {
  method = 'get'
  handler(req, res) {
    const host = req.headers['x-forwarded-host'] || req.headers['host']
    const proto = req.headers['x-forwarded-proto'] || 'http'

    const response = {
      ...this.options.spec,
      servers: [
        {
          url: [proto, '://', host, this.options.spec.servers[0].url].join('')
        }
      ]
    }

    res.status(200).json(response)
  }
}

export default SwaggerDoc
