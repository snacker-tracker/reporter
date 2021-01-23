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

const response = (description) => {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          '$ref': '#/components/schemas/ErrorResponse'
        }
      }
    }
  }
}

const add400Response = (swagger) => {
  for(let path in swagger.paths) {
    for(let verb in swagger.paths[path]) {
      if(verb != 'parameters') {
        swagger.paths[path][verb].responses[400] = response('Client error, most likely invalid input')
        swagger.paths[path][verb].responses[401] = response('Unauthorized: This api requires authentication')
        swagger.paths[path][verb].responses[403] = response('Forbidden: You may not be allowed to do this')
        swagger.paths[path][verb].responses[500] = response('Something went wrong on the backend. *Probably* not your fault')

        if(verb !== 'get') {
          swagger.paths[path][verb].responses[409] = response('The request contains, or would create, a conflict (duplicate, probably)')
        }
      }
    }
  }

  return swagger
}

const setResponseValidityHeader = (swagger) => {
  for(let path in swagger.paths) {
    for(let verb in swagger.paths[path]) {
      if(verb != 'parameters') {
        for(let response in swagger.paths[path][verb].responses) {
          swagger.paths[path][verb].responses[response].headers = {
            'X-Swagger-Response-Valid': {
              schema: {
                'type': 'boolean',
              },
              'description': 'Whether the response object matched the documented schema'
            },
            'X-Swagger-Response-Error-Count': {
              schema: {
                'type': 'integer',
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
  if(Config.oauth.enabled) {
    const bearerConfig = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: `https://${Config.oauth.issuer}/authorize?audience=${Config.oauth.audience}`,
          tokenUrl: `https://${Config.oauth.issuer}/oauth/token`,
          scopes: {
            openid: 'openid',
            profile: 'your basic profile information'
          }
        }
      }
    }

    swagger.components.securitySchemes = {
      Bearer: bearerConfig
    }
  }

  return swagger
}

const setSecurityOnOperations = (swagger) => {
  for(let path in swagger.paths) {
    for(let verb in swagger.paths[path]) {
      if(verb != 'parameters') {
        swagger.paths[path][verb].security = [ { Bearer: [] } ]
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
