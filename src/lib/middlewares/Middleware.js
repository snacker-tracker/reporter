class Middleware {
  method = 'use'
  path = null

  handler(req, res, next) {
    next(req, res)
  }

  constructor(path, options = {}) {
    this.path = path
    this.options = options
    this.handler = this.handler.bind(this)
  }

  registerFunction(app) {
    const bound = app[this.method].bind(app)
    return () => {
      if(this.path) {
        bound(this.path, this.handler)
      } else {
        bound(this.handler)
      }
    }
  }
}

export default Middleware
