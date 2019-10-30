import Config from '../config'

import Metrics from '../lib/metrics'

const observe = (action, start, end, response) => {
  Metrics.auth0_time_spent.labels(
    Config.auth0.issuer,
    action,
    response.status
  ).observe((end - start) / 1000)

  Metrics.auth0_rate_limiting_limit.labels(
    Config.auth0.issuer,
    action,
  ).set(parseInt(response.headers['x-ratelimit-limit']))

  Metrics.auth0_rate_limiting_remaining.labels(
    Config.auth0.issuer,
    action,
  ).set(parseInt(response.headers['x-ratelimit-remaining']))

  Metrics.auth0_rate_limiting_reset.labels(
    Config.auth0.issuer,
    action,
  ).set(parseInt(response.headers['x-ratelimit-reset']))
}

export default {
  observe
}