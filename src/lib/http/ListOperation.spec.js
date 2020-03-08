import ListOperation from './ListOperation'
import logger from '../../services/logger'

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

class ExampleOperation extends ListOperation {
  static canBeCalledAnonymously = true
  static model = MockModel
}

const event_publisher = {
  publish() {}
}

describe(ListOperation, () => {
  let operation
  let request
  let queryBuilder
  let publisher

  beforeEach( () => {
    jest.spyOn(logger, 'info').mockReturnValue(true)

    jest.spyOn(logger, 'warn').mockReturnValue(true)

    operation = new ExampleOperation({ logger, event_publisher })
    request = {
      query: {
        limit: 100,
        offset: 0
      }
    }

    queryBuilder = TestQueryBuilder.forClass(MockModel)

    publisher = jest.spyOn(event_publisher, 'publish')
    publisher.mockClear()

    MockModel.query = jest.fn()
    MockModel.query.mockReturnValue(queryBuilder)
    queryBuilder.resolve([{
      'id': 'deadbeef',
      'key': 'value'
    }])
  })


  describe('behaviour', () => {
    it('calls Model.query with the default args', async () => {
      await operation.run(request, null)

      expect(queryBuilder._operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'limit',
            args: [100]
          }),
          expect.objectContaining({
            name: 'offset',
            args: [0]
          }),
          expect.objectContaining({
            name: 'orderBy',
            args: ['created_at', 'desc']
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

    it('responds a 200 on success', async () => {
      const response = await operation.run(request, null)

      expect(response.status).toBe(200)
    })

    it('returns the rows in $.items', async () => {
      const response = await operation.run(request, null)

      expect(response.body.items.length).toBe(1)
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            'id': 'deadbeef',
            'key': 'value'
          })
        ])
      )
    })


    it('returns a 500 on unhandled exceptions', async () => {
      queryBuilder.reject({
        code: 'whatever'
      })

      const response = await operation.run(request, null)

      expect(response.status).toBe(500)
    })
  })
})
