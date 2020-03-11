import AWS from 'aws-sdk'

import Logger from '../lib/Logger'
import prometheus from '../services/prometheus'
import metrics from '../services/metrics'

const stream = (config, services) => {
  const kinesis = new AWS.Kinesis(config.kinesis)

  const dependencies = (event, handler) => {
    const logger = new Logger()

    logger.setContext('component', 'stream-processor')

    return {
      logger,
      kinesis,
      config,
      prometheus
    }
  }

  return dependencies
}

export default stream
