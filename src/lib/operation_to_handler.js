import Config from '../config'
import logger from './logger'
import EventPublisher from './event_publisher'
import AWS from 'aws-sdk'

let kinesis_client
let stream_name

let s3_client
let s3_bucket
console.log(Config.s3)
if(Config.s3) {
  s3_client = new AWS.S3(Config.s3)
  s3_bucket = Config.s3.bucket
}

class ImageRepository {
  constructor(s3client, bucket) {
    this.client = s3client
    this.bucket = bucket
  }

  async put(key, readable) {
    const args = {
      Bucket: this.bucket,
      Key: key,
      Body: readable
    }

    return this.client.upload(args).promise()
  }

  async list(prefix) {
    const params = {
      Bucket: this.bucket,
      Prefix: prefix
    }

    return this.client.listObjects(params).promise()
  }

  presign(key) {
    const args = {
      Bucket: this.bucket,
      Key: key,
      Expires: 300
    }

    return this.client.getSignedUrl('getObject', {
      ...args
    })
  }
}

const IR = new ImageRepository(s3_client, s3_bucket)


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


const operation_to_handler = (operationId, operation) => {
  return [async (req, res) => {

    const l = new logger.constructor(logger.instance)
const EP = new EventPublisher(kinesis_client, stream_name, {logger: l})
    if (req.correlation_id) {
      l.setContext('correlation_id', req.correlation_id)
    }
    l.setContext('request_id', req.request_id)

    const cmd = new operation({
      logger: l,
      event_publisher: EP,
      image_repository: IR
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
