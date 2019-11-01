import prom from 'prom-client'

const send_email_time_spent = new prom.Histogram({
  name: 'send_email_time_spent',
  help: 'time spent sending emails',
  labelNames: ['provider', 'successful'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5]
})

const swagger_operation_time_spent = new prom.Histogram({
  name: 'swagger_operation_time_spent',
  help: 'time spent in operations',
  labelNames: ['operationId', 'statusCode'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5]
})

let api_user_agents = new prom.Counter({
  name: 'api_user_agents',
  help: 'get the distribution of user agents and their version (eg, apps)',
  labelNames: ['user_agent', 'version']
})

const swagger_invalid_responses = new prom.Histogram({
  name: 'swagger_invalid_responses',
  help: 'number of responses that had one or more schema errors',
  labelNames: ['operationId', 'statusCode'],
})

const swagger_response_errors = new prom.Histogram({
  name: 'swagger_response_errors',
  help: 'number of responses that had one or more schema errors',
  labelNames: ['operationId', 'statusCode'],
})


const auth0_time_spent = new prom.Histogram({
  name: 'auth0_time_spent',
  help: 'Time spent talking to auth0',
  labelNames: ['tenant', 'action', 'statusCode'],
  buckets: [0.1, 0.25, 0.5, 1, 2]
})

const knex_query_response_time = new prom.Histogram({
  name: 'knex_query_response_time_seconds',
  help: 'duration of queries in seconds',
  labelNames: ['command', 'operationId'],
})

const knex_query_affected_rows = new prom.Histogram({
  name: 'knext_query_affected_rows',
  help: 'number of rows affected by a query',
  labelNames: ['command', 'operationId'],
  buckets: [0, 1, 5, 10, 25, 100]
})

const upc_queries = new prom.Counter({
  name: 'upc_queries',
  help: 'number of rows affected by a query',
  labelNames: ['provider', 'successful']
})


const Metrics = {
  send_email_time_spent,
  api_user_agents,
  swagger_operation_time_spent,
  swagger_invalid_responses,
  swagger_response_errors,
  knex_query_response_time,
  knex_query_affected_rows
}

export default Metrics
