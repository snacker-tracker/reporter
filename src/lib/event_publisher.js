import uuid from 'uuid'

class EventPublisher {
  constructor(kinesis_client, stream_name, services) {
    this.kinesis_client = kinesis_client
    this.stream_name = stream_name

    this.services = services
  }

  publish(event, payload, actor = null) {
    let data = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      event: event,
      actor: actor,
      payload: payload
    }

    const params = {
      Data: JSON.stringify(data) + '\r\n',
      PartitionKey: payload.id || uuid(),
      StreamName: this.stream_name
    }

    this.services.logger.info({
      message: "wrote to the stream",
      event: data
    })

    return this.kinesis_client.putRecord(params).promise()
  }
}

export default EventPublisher
