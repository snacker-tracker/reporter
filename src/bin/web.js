import bodyParser from 'body-parser'
import express from 'express'
import http from 'http'
import path from 'path'
import multer from 'multer'

import { initialize } from 'express-openapi'

import dependencies from '../services/web'

import Config from '../config'

import { getSwaggerDocument } from '../lib/swagger'
import operation_to_handler from '../lib/operation_to_handler'
import operations from '../handlers/http'

import middlewares from '../services/middlewares'

const swaggerDoc = getSwaggerDocument(
  path.join(__dirname, '../swagger.yml')
)

let app = express()

app.use(async (req, _, next) => {
  req.locals = {
    startTime: new Date()
  }
  next()
})

const injector = dependencies(Config, {})

const services = injector({},{})

middlewares(app, {
  config: Config,
  spec: swaggerDoc,
  services: injector({}, {})
})

const handlers = Object.entries(operations)
  .map(([operationId, operation]) => {
    return operation_to_handler(operationId, operation, injector)
  }).reduce((accumulator, current) => {
    accumulator[current[1]] = current[0]
    return accumulator
  }, {})

initialize({
  app,
  apiDoc: swaggerDoc,
  operations: handlers,
  errorMiddleware: (err, _, res, next) => {
    if('status' in err) {
      services.logger.warn({ message: 'Unhandled error', err })
      res.status(err.status).json(err)
    } else {
      next(err)
    }
  },
  consumesMiddleware: {
    'application/json': bodyParser.json(),
    'application/x-www-form-urlencoded': bodyParser.urlencoded(),
    'multipart/form-data': function(req, res, next) {
      multer().any()(req, res, function(err) {
        if (err) return next(err)
        req.files.forEach(function(file) {
          req.body[file.fieldname] = '' // Set to empty string to satisfy OpenAPI spec validation
        })
        return next()
      })
    },
    'application/octet-stream': function(req, res, next) {
      multer().any()(req, res, function(err) {
        console.log(err)
        return next()
      })
    }
  }
})

app.server = http.createServer(app)
app.server.listen(process.env.PORT || Config.port, () => {
  console.log('started')
})

export default app
