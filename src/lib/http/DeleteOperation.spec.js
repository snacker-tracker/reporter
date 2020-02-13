import DeleteOperation from './DeleteOperation'
import logger from '../logger'

import { Model, QueryBuilder } from 'objection'

class TestQueryBuilder extends QueryBuilder {
  resolve(results) {
    this._resulter = () => {
      return results
    }
  }

  reject(error) {
    this._resulter = () => {
      throw error
    }
  }

  then(callback) {
    callback(this._resulter())
  }
}

class MockModel extends Model {

}

class ExampleOperation extends DeleteOperation {
  static canBeCalledAnonymously = true
  static model = MockModel
}

const event_publisher = {
  publish() {}
}

describe(DeleteOperation, () => {
  let operation
  let request
  let queryBuilderProvider
  let queryResult
  let queryBuilder
  let publisher

  beforeEach( () => {
    operation = new ExampleOperation({ logger, event_publisher })
    request = {
      params: {
        id: 'deadbeef'
      }
    }

    queryBuilder = TestQueryBuilder.forClass(MockModel)

    publisher = jest.spyOn(event_publisher, 'publish')
    publisher.mockClear()

    MockModel.query = jest.fn()
    MockModel.query.mockReturnValue(queryBuilder)
    queryBuilder.resolve({
      'id': 'deadbeef'
    })
  })


  describe('behaviour', () => {
    it('calls Model.delete with the correct id', async () => {
      await operation.run(request, null)

      expect(queryBuilder._operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'delete'
          }),
          expect.objectContaining({
            name: 'options',
            args: [
              { 'operationId': 'ExampleOperation' }
            ]
          })

        ])
      )
    })

    it('responds a 201 on success', async () => {
      const response = await operation.run(request, null)

      expect(response.status).toBe(201)
    })

    it('publishes an event post creation', async () => {
      const response = await operation.run(request, null)
      expect(publisher).toHaveBeenCalledWith(
        'MockModelDeleted',
        expect.objectContaining({
          'id': 'deadbeef'
        }),
        undefined
      )
    })

    it('returns a 404 when the object doesnt exist', async () => {
      queryBuilder.resolve(null)

      const response = await operation.run(request, null)

      expect(response.status).toBe(404)
    })


    it('returns a 500 on unhandled exceptions', async () => {
      queryBuilder.reject({
        code: 'whatever'
      })

      const response = await operation.run(request, null)

      expect(response.status).toBe(500)
    })

    it('does not publish events when the delete fails', async () => {
      queryBuilder.reject({
        code: 'whatever'
      })

      await operation.run(request, null)

      expect(publisher).not.toHaveBeenCalled()
    })
  })
})
