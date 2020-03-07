import jwt from 'express-jwt'
import jwksRsa from 'jwks-rsa'

import Middleware from './Middleware'

class Auth extends Middleware {
  constructor(path = false, options) {
    super(path, options)
    this.configure(options.config.oauth)
  }

  configure(config) {
    this.check = jwt({
      credentialsRequired: false,
      secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${config.issuer}/.well-known/jwks.json`
      }),

      audience: `${config.audience}`,
      issuer: `https://${config.issuer}/`,
      algorithms: ['RS256']
    })
  }

  handler(req, res, next) {
    this.check(req, res, next)
  }
}

export default Auth
