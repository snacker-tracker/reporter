class Logger {
  constructor() {
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

    console.log(JSON.stringify({
      level,
      ...this.context,
      ...message
    }))
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

export default Logger
