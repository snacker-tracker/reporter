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

  stringifyError(value) {
    if (value instanceof Error) {
      let error = {}

      Object.getOwnPropertyNames(value).forEach(function (key) {
        error[key] = value[key]
      })

      error.stack = error.stack.split('\n').map( s => s.trim() )

      return error
    } else {
        return value
    }
  }

  replaceErrors(message) {
    for(const kv of Object.entries(message)) {
      message[kv[0]] = this.stringifyError(kv[1])
    }

    return message
  }

  _log(message, level) {
    if(message instanceof Error) {
      message = this.stringifyError(message)
      message = { error: message }
    }

    if (typeof message == 'string') {
      message = { message }
    }

    message = this.replaceErrors(message)

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
