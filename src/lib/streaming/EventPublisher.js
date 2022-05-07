import { v4 as uuid } from 'uuid'

class EventPublisher {
  constructor(kinesis_client, stream_name, services) {
    this.kinesis_client = kinesis_client
    this.stream_name = stream_name

    this.services = services
  }

  getActor(actor) {
    let act
    if(actor) {
      act = {
        iss: actor.iss || false,
        sub: actor.sub || false,
      }
    } else {
      act = {
        sub: 'ANONYMOUS'
      }
    }

    return act
  }

  getEvent(event, payload, actor) {
    let data = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      event: event,
      actor: this.getActor(actor),
      payload: payload
    }

    return data
  }

  publish(event, payload, actor = null) {
    let event_to_be_published = this.getEvent(event, payload, actor)
    const params = {
      Data: JSON.stringify(event_to_be_published) + '\r\n',
      PartitionKey: payload.id || uuid(),
      StreamName: this.stream_name
    }

    this.services.logger.info({
      message: 'wrote to the stream',
      event: event_to_be_published
    })

    return this.kinesis_client.putRecord(params).promise()
  }
}

export default EventPublisher
