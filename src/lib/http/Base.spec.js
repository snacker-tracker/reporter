import { HTTPResponse, Operation } from './Base'
import logger from '../../services/logger'

class ExampleAuthenticatedOperation extends Operation {
  static canBeCalledAnonymously = false

  execute() {
    return HTTPResponse.Okay(this.toHttpRepresentation(this.resources.resource))
  }

}

class UnimplementedOperation extends Operation {
  static canBeCalledAnonymously = true
}


class ExampleOperation extends Operation {
  static canBeCalledAnonymously = true

  execute() {
    return HTTPResponse.Okay(this.toHttpRepresentation(this.resources.resource))
  }
}

describe(Operation, () => {
  let operation
  let request

  beforeEach( () => {
    let log_info = jest.spyOn(logger, 'info')
    log_info.mockReturnValue(true)

    let log_warn = jest.spyOn(logger, 'warn')
    log_warn.mockReturnValue(true)


    operation = new ExampleOperation({ logger })
    request = {
      params: {
        id: 'deadbeef-1'
      },
      query: {
        include_meta: false
      }
    }
  })

  describe('behaviour', () => {
    it('returns a 401 if it cannot be called anonymously', async () => {
      const config = {
        auth: {
          authn: {
            enabled: true
          },
          authz: {
            enabled: true
          }
        }
      }

      operation = new ExampleAuthenticatedOperation({ logger, config })
      const response = await operation.run(request, {})

      expect(response.constructor.name).toBe('HTTPResponse')
      expect(response.status).toBe(401)
    })

    it('returns a 500 if execute() throws an exception', async () => {
      operation.execute = async () => {
        throw new Error('Unhandled?!')
      }
      const response = await operation.run(request, {})
      expect(response.constructor.name).toBe('HTTPResponse')
      expect(response.status).toBe(500)

    })

    it('returns a 500 if execute() throws an exception', async () => {
      operation.fetch = async () => {
        throw new Error('Unhandled?!')
      }
      const response = await operation.run(request, {})
      expect(response.constructor.name).toBe('HTTPResponse')
      expect(response.status).toBe(500)

    })

    it('the base class returns a 501 - Not Implemented', async () => {
      const config = {
        auth: {
          authn: {
            enabled: true
          },
          authz: {
            enabled: true
          }
        }
      }

      const operation = new UnimplementedOperation({ logger, config })

      const response = await operation.run(request, {})
      expect(response.constructor.name).toBe('HTTPResponse')
      expect(response.status).toBe(501)
    })
  })
})
