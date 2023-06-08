class Logger {
  context: { [key: string]: string }

  constructor() {
    this.clearContext()
  }

  setContext(key: string, value = null) {
    if (value) {
      this.context[key] = value
    } else {
      delete this.context[key]
    }
  }

  clearContext() {
    this.context = {}
  }

  log(message: string | Error | {}, level: 'debug' | 'info' | 'warn' | 'error') {
    if(message instanceof Error) {
      message = { error: message }
    }

    if (typeof message == 'string') {
      message = { message }
    }

    console.log(JSON.stringify({
      level,
      ...this.context,
      ...message
    }))
  }

  debug(message: string | {} | Error) {
    this.log(message, 'debug')
  }

  info(message: string | {} | Error) {
    this.log(message, 'info')
  }

  warn(message: string | {} | Error) {
    this.log(message, 'warn')
  }

  error(message: string | {} | Error) {
    this.log(message, 'error')
  }
}

export default Logger
