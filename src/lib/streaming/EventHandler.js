class EventHandler {
  constructor(services) {
    this.services = services
  }

  run(event) {
    throw new Error('NotImplemented (' + event + ')')
  }
}

export default EventHandler
