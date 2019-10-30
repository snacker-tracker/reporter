import Config from '../config'
import fs from 'fs'
import yaml from 'yaml'

const readSwagger = (path) => {
  return yaml.parse(fs.readFileSync(path).toString('utf-8'))
}

const setScheme = (swagger) => {
  if (process.env.NODE_ENV != 'production') {
    //swagger.schemes = ['http']
  }

  return swagger
}

const add400Response = (swagger) => {
  for(let p in swagger.paths) {
    for(let verb in swagger.paths[p]) {
      if(verb != 'parameters') {
        swagger.paths[p][verb].responses[400] = {
          description: 'Client error, most likely invalid input',
          content: {
            'application/json': {
              schema: {
                '$ref': '#/components/schemas/ErrorResponse'
              }
            }
          }
        }

        swagger.paths[p][verb].responses[401] = {
          description: 'Unauthorized: This api requires authentication',
          content: {
            'application/json': {
              schema: {
                '$ref': '#/components/schemas/ErrorResponse'
              }
            }
          }
        }

        swagger.paths[p][verb].responses[403] = {
          description: 'Forbidden: You may not be allowed to do this',
          content: {
            'application/json': {
              schema: {
                '$ref': '#/components/schemas/ErrorResponse'
              }
            }
          }
        }

        if(verb !== 'get') {
          swagger.paths[p][verb].responses[409] = {
            description: 'The request contains, or would create, a conflict (duplicate, probably)',
            content: {
              'application/json': {
                schema: {
                  '$ref': '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }

        swagger.paths[p][verb].responses[500] = {
          description: 'Something went wrong on the backend. *probably* not your fault',
          content: {
            'application/json': {
              schema: {
                '$ref': '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  }

  return swagger
}

const setResponseValidityHeader = (swagger) => {
  for(let p in swagger.paths) {
    for(let verb in swagger.paths[p]) {
      if(verb != 'parameters') {
        for(let response in swagger.paths[p][verb].responses) {
          swagger.paths[p][verb].responses[response].headers = {
            'X-Swagger-Response-Valid': {
              schema: {
                'type': 'boolean',
              },
              'description': 'Whether the response object matched the documented schema'
            },
            'X-Swagger-Response-Error-Count': {
              schema: {
                'type': 'number',
              },
              'description': 'Number of schema errors counted in the response'
            }
          }
        }
      }
    }
  }

  return swagger
}

const setVersion = (swagger) => {
  swagger.info.version = process.env.APP_VERSION || '0.0.1-snapshot'

  return swagger
}

const setSecuritySettings = (swagger) => {
  /*
  if(Config.auth0.isEnabled) {
    const bearerConfig = {
      type: 'oauth2',
      flows: {
        implicit: {
          authorizationUrl: `https://${Config.auth0.issuer}/authorize?audience=${Config.auth0.audience}`,
          scopes: {
            openid: 'openid',
            profile: 'your basic profile information',
            phone: 'your phone number',
          }
        },
        authorizationCode: {
          authorizationUrl: `https://${Config.auth0.issuer}/authorize?audience=${Config.auth0.audience}`,
          tokenUrl: `https://${Config.auth0.issuer}/oauth/token`,
          scopes: {
            openid: 'openid',
            profile: 'your basic profile information',
            phone: 'your phone number',
            offline_access: 'Get a refresh token (optional)'
          }
        }
      }
    }

    swagger.components.securitySchemes = {
      Bearer: bearerConfig
    }
  }
  */

  return swagger
}

const setSecurityOnOperations = (swagger) => {
  for(let p in swagger.paths) {
    for(let verb in swagger.paths[p]) {
      if(verb != 'parameters') {
        swagger.paths[p][verb].security = [ { Bearer: [] } ]
      }
    }
  }

  return swagger
}

// lol. ugly a.f. but works
const getSwaggerDocument = (path) => {
  return setSecurityOnOperations(
    setResponseValidityHeader(
      setSecuritySettings(
        setVersion(
          setScheme(
            add400Response(
              readSwagger(path)
            )
          )
        )
      )
    )
  )
}

export {
  getSwaggerDocument
}
