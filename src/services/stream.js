import AWS from 'aws-sdk'

import Logger from '../lib/Logger'
import prometheus from '../services/prometheus'

const stream = (config) => {
  const kinesis = new AWS.Kinesis(config.kinesis)

  // eslint-disable-next-line   no-unused-vars
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
