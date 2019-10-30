import winston from 'winston'

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
})

class Logger {
  constructor(instance) {
    this.instance = instance
    this.clearContext()
  }

  setContext(key, value = null) {
    if (value) {
      this.context[key] = value
    } else {
      delete this.context[key]
    }
  }

  clearContext() {
    this.context = {}
  }

  _log(message, level) {
    if (typeof (message) == 'string') {
      message = { message }
    }

    this.instance[level]({
      ...this.context,
      ...message
    })

  }

  debug(message) {
    this._log(message, 'debug')
  }

  info(message) {
    this._log(message, 'info')
  }

  warn(message) {
    this._log(message, 'warn')
  }

  error(message) {
    this._log(message, 'error')
  }
}

export default new Logger(logger)
