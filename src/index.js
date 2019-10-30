import Config from './config'

import promBundle from 'express-prom-bundle'
import bodyParser from 'body-parser'
import express from 'express'
import http from 'http'
import path from 'path'

import request_id from './middlewares/request_id'

import cors from 'cors'

import validate_response from './lib/validate_response'

import access_logs from './lib/accesslog'

import { getSwaggerDocument } from './lib/swagger'

import operations from './operations'
import operation_to_handler from './lib/operation_to_handler'
import logger from './lib/logger'

import { initialize } from 'express-openapi'

const swaggerDoc = getSwaggerDocument(
  path.join(__dirname, 'swagger.yml')
)

let app = express()

app.use(promBundle({}))
app.use(access_logs)
app.use(cors())

app.get('/health', (req, res) => {
  res.status(200).json('ok')
})

app.get('/api-doc', (req, res) => {
  res.status(200).json(swaggerDoc)
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
      validate_response,
      request_id
    ]
  },
  operations: handlers,
  consumesMiddleware: {
    'application/json': bodyParser.json(),
    'application/x-www-form-urlencoded': bodyParser.urlencoded(),
  },
})


app.use((err, req, res, next) => {
  res.status(err.status).json(err)
  next()
})

app.server = http.createServer(app)
app.server.listen(process.env.PORT || Config.port, () => {
  logger.info(`Started on port ${app.server.address().port}`)
})

export default app
