import uuid from 'uuid'

class EventPublisher {
  constructor(kinesis_client, stream_name) {
    this.kinesis_client = kinesis_client
    this.stream_name = stream_name
  }

  publish(event, payload) {
    let data = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      event: event,
      payload: payload
    }

    const params = {
      Data: JSON.stringify(data) + '\r\n',
      PartitionKey: payload.id || uuid(),
      StreamName: this.stream_name
    }

    return this.kinesis_client.putRecord(params).promise()
  }
}

export default EventPublisher
