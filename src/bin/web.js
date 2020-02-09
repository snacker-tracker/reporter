import promBundle from 'express-prom-bundle'
import bodyParser from 'body-parser'
import express from 'express'
import http from 'http'
import path from 'path'
import multer from 'multer'
import cors from 'cors'
import { initialize } from 'express-openapi'

import Config from '../config'
import RequestId from '../lib/middlewares/RequestId'
import ValidateResponse from '../lib/middlewares/ValidateResponse'
import AccessLogs from '../lib/middlewares/AccessLogs'
import { getSwaggerDocument } from '../lib/swagger'
import operations from '../handlers/http'
import operation_to_handler from '../lib/operation_to_handler'
import logger from '../lib/logger'
import Auth from '../lib/middlewares/Auth'

const swaggerDoc = getSwaggerDocument(
  path.join(__dirname, '../swagger.yml')
)

let app = express()

app.use(promBundle({}))
app.use(AccessLogs)
app.use(cors())

app.get('/health', (req, res) => {
  res.status(200).json('ok')
})

app.get('/api-doc', (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers['host']
  const proto = req.headers['x-forwarded-proto'] || 'http'

  const response = {
    ...swaggerDoc,
    servers: [
      {
        url: [proto, '://', host, swaggerDoc.servers[0].url].join('')
      }
    ]
  }

  res.status(200).json(response)
})

const handlers = Object.entries(operations)
  .map(([operationId, operation]) => {
    console.log(operationId)
    return operation_to_handler(operationId, operation)
  }).reduce((accumulator, current) => {
    accumulator[current[1]] = current[0]
    return accumulator
  }, {})

initialize({
  app,
  apiDoc: {
    ...swaggerDoc,
    'x-express-openapi-additional-middleware': [
      ValidateResponse,
      RequestId,
      Auth(Config.oauth)
    ]
  },
  operations: handlers,
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


app.use((err, req, res, next) => {
  console.log(err)
  res.status(err.status).json(err)
  next()
})

app.server = http.createServer(app)
app.server.listen(process.env.PORT || Config.port, () => {
  logger.info(`Started on port ${app.server.address().port}`)
})

export default app
