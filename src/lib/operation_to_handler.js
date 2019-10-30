import Config from '../config'
import logger from './logger'
import EventPublisher from './event_publisher'
import AWS from 'aws-sdk'

let kinesis_client
let stream_name


if (Config.kinesis.enabled) {
  kinesis_client = new AWS.Kinesis(Config.kinesis)
  stream_name = Config.kinesis.stream_name
} else {
  kinesis_client = {
    putRecord: (event) => {
      console.log('Would have written', JSON.stringify(event), 'to the wire')
      return {
        promise: () => { Promise.resolve(true) }
      }
    }
  }
  stream_name = 'doesnt-exist'
}

const EP = new EventPublisher(kinesis_client, stream_name)

const operation_to_handler = (operationId, operation) => {
  return [async (req, res) => {

    const l = new logger.constructor(logger.instance)
    if (req.correlation_id) {
      l.setContext('correlation_id', req.correlation_id)
    }
    l.setContext('request_id', req.request_id)

    const cmd = new operation({
      logger: l,
      event_publisher: EP
    })

    let response
    try {
      response = await cmd.run(req, res)
    } catch (error) {
      console.log(error)
      response = {
        status: 500,
        body: error,
        headers: {}
      }
    }

    return res
      .status(response.status)
      .set(response.headers)
      .set(
        'Access-Control-Expose-Headers',
        'X-Swagger-Response-Valid, X-Swagger-Response-Error-Count')
      .json(response.body)
  }, operationId]
}

export default operation_to_handler
