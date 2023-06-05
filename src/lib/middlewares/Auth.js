import { expressjwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'

import Middleware from './Middleware'

class Auth extends Middleware {
  constructor(path = false, options) {
    super(path, options)
    this.configure(options.config.oauth)
  }

  configure(config) {
    const secret = jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${config.issuer}/.well-known/jwks.json`
    })

    this.check = expressjwt({
      credentialsRequired: false,

      secret,
      audience: `${config.audience}`,
      issuer: `https://${config.issuer}/`,
      algorithms: ['RS256']
    })
  }

  async handler(req, res, next) {
    await this.check(req, res, next)
  }
}

export default Auth
