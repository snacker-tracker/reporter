import AWS from 'aws-sdk'
import prometheus from 'prom-client'

import Logger from '../lib/Logger'
import metrics from './metrics'
import EventPublisher from '../lib/streaming/EventPublisher'
import ImageRepository from '../lib/ImageRepository'

import Models from '../services/models'


const web = (config, services) => {
  const kinesis = new AWS.Kinesis(config.kinesis)
  const s3 = new AWS.S3(config.s3)
  const image_repository = new ImageRepository(s3, config.s3.bucket)

  const dependencies = (handlerClass, req) => {
    return {
      config,
      kinesis,
      s3,
      metrics,
      prometheus,
      image_repository,
      models: Models,

      get logger() {
        const logger = new Logger()
        logger.setContext('correlation_id', req.correlation_id)
        logger.setContext('request_id', req.request_id)
        return logger
      },

      get event_publisher() {
        return new EventPublisher(kinesis, this.config.kinesis.stream_name, { logger: this.logger })
      }
    }
  }

  return dependencies
}

export default web
