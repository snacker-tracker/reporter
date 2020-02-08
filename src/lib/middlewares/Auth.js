const jwt = require('express-jwt')
const jwtAuthz = require('express-jwt-authz')
const jwksRsa = require('jwks-rsa')

// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set

const Auth = (config) => {
  const checkJwt = jwt({
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

  return checkJwt
}

export default Auth
