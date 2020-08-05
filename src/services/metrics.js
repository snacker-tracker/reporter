import prom from 'prom-client'

const defaults = {
  registers: []
}

const swagger = {
  labelNames: ['operationId', 'statusCode']
}

const knex = {
  labelNames: ['command', 'operationId']
}

const swagger_operation_time_spent = new prom.Histogram({
  name: 'swagger_operation_time_spent',
  help: 'time spent in operations',
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  ...swagger,
  ...defaults
})

let api_user_agents = new prom.Counter({
  name: 'api_user_agents',
  help: 'get the distribution of user agents and their version (eg, apps)',
  ...swagger
})

let openid_clients = new prom.Counter({
  name: 'openid_clients_count',
  help: 'Counting the number of openid clients',
  labelNames: ['operationId', 'openid_client']
})


const swagger_invalid_responses = new prom.Histogram({
  name: 'swagger_invalid_responses',
  help: 'number of responses that had one or more schema errors',
  buckets: [],
  ...swagger,
  ...defaults
})

const swagger_response_errors = new prom.Histogram({
  name: 'swagger_response_errors',
  help: 'number of responses that had one or more schema errors',
  buckets: [],
  ...swagger,
  ...defaults
})

const knex_query_response_time = new prom.Histogram({
  name: 'knex_query_response_time_seconds',
  help: 'duration of queries in seconds',
  ...knex,
  ...defaults
})

const knex_query_affected_rows = new prom.Histogram({
  name: 'knext_query_affected_rows',
  help: 'number of rows affected by a query',
  buckets: [0, 1, 5, 10, 25, 100],
  ...knex,
  ...defaults
})

const product_info_store_time_spent = new prom.Histogram({
  name: 'product_info_store_time_spent',
  help: 'time spent querying product information stores',
  labelNames: ['provider'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  ...defaults
})

const Metrics = {
  swagger: {
    invalid_responses: swagger_invalid_responses,
    response_errors: swagger_response_errors,
    time_spent: swagger_operation_time_spent,
    api_user_agents,
    openid_clients
  },
  knex: {
    response_time: knex_query_response_time,
    affected_rows: knex_query_affected_rows
  },
  other: {
    product_info_store_time_spent
  }
}

export default Metrics
