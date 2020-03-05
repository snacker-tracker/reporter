const Knex = require('knex')
import { development, production } from './knexfile'

import Config from '../config/'

import Metrics from '../services/metrics'

// Initialize knex.
let knexConfig = development
if (Config.env === 'production') {
  knexConfig = production
}

const knex = Knex(knexConfig)

const timings = {}

knex
  .on('query', (query) => {
    timings[query.__knexQueryUid] = Date.now()
  })
  .on('query-response', (response, query) => {
    const responseTime = (Date.now() - timings[query.__knexQueryUid]) / 1000

    Metrics.knex.response_time.labels(
      query.method, query.options.operationId || 'unknown'
    ).observe(responseTime)

    Metrics.knex.affected_rows.labels(
      query.method,
      query.options.operationId || 'unknown'
    ).observe(query.response.rowCount)

    if(query.options.logger) {
      query.options.logger.info({
        message: 'SQL query completed',
        method: query.method,
        query: query.sql.trim(),
        time_spent: responseTime
      })
    }
  })

export default knex
