import jwt from 'express-jwt'
import jwksRsa from 'jwks-rsa'

import Middleware from './Middleware'

class Auth extends Middleware {
  constructor(path = false, options) {
    super(path, options)
    this.configure(options.config)
  }

  configure(options) {
    this.check = jwt({
      credentialsRequired: false,
      secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${this.options.config.issuer}/.well-known/jwks.json`
      }),

      audience: `${this.options.config.audience}`,
      issuer: `https://${this.options.config.issuer}/`,
      algorithms: ['RS256']
    })
  }

  handler(req, res, next) {
    this.check(req, res, next)
  }
}

export default Auth
