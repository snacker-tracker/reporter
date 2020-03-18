import GetOperation from './GetOperation'

const Query = {
  query: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis()
}

const Model = {
  query: jest.fn(),
  findById: jest.fn()
}


class ExampleGetOperation extends GetOperation {
  static model = Query

  async extract_params(req) {
    this.args = {
      id: req.params.id
    }
  }
}

describe(GetOperation, () => {
  let operation
  let request
  beforeEach( () => {
    Model.query.mockClear()
    operation = new ExampleGetOperation()
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
    it('returns an HTTPResponse', async () => {
      const response = await operation.run(request, {})
      expect(response.constructor.name).toBe('HTTPResponse')
    })

    it('queried the model using request.params.id', async () => {
      await operation.run(request)

      expect(operation.constructor.model.query).toHaveBeenCalled()
      expect(operation.constructor.model.findById).toHaveBeenCalledWith('deadbeef-1')
    })

    it('returns a 404 when the resource is null/misconfigured', async () => {
      operation.resources = () => {
        return {
          resource: null
        }
      }
      await operation.run(request)

      expect(operation.constructor.model.query).toHaveBeenCalled()
      expect(operation.constructor.model.findById).toHaveBeenCalledWith('deadbeef-1')
    })

    it('returns a 404 when the user gets denied', async () => {
      operation.requesterCanReadResource = () => {
        return false
      }

      const result = await operation.run(request)

      expect(operation.constructor.model.query).toHaveBeenCalled()
      expect(operation.constructor.model.findById).toHaveBeenCalledWith('deadbeef-1')

      expect(result.status).toBe(404)
    })
  })
})
