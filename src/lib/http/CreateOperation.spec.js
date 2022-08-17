import CreateOperation from './CreateOperation'
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

class ExampleOperation extends CreateOperation {
  static canBeCalledAnonymously = true
  static model = MockModel
}

const event_publisher = {
  publish() {}
}

describe(CreateOperation, () => {
  let operation
  let request
  let queryBuilder
  let publisher
  let info

  beforeEach( () => {
    operation = new ExampleOperation({ logger, event_publisher })
    request = {
      body: {
        'some-property': 'some value',
        'another-property': 'another value'
      }
    }

    queryBuilder = TestQueryBuilder.forClass(MockModel)

    publisher = jest.spyOn(event_publisher, 'publish')
    publisher.mockClear()

    MockModel.query = jest.fn()
    MockModel.query.mockReturnValue(queryBuilder)
    queryBuilder.resolve({
      'some-property': 'some value',
      'another-property': 'another value'
    })

    info = jest.spyOn(logger, 'info')
    info.mockReturnValue(true)

  })


  describe('behaviour', () => {
    it('calls Model.insert with the request body', async () => {

      await operation.run(request, null)

      expect(queryBuilder._operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'insertAndFetch'
          }),
          expect.objectContaining({
            name: 'options',
            args: expect.arrayContaining([
              expect.objectContaining({ 'operationId': 'ExampleOperation' })
            ])
          })
        ])
      )
    })

    it('responds a 201 on success', async () => {
      const response = await operation.run(request, null)

      expect(response.status).toBe(201)
    })

    it('responds with the inserted object on success', async () => {
      const response = await operation.run(request, null)

      expect(response.body).toMatchObject({
        'some-property': 'some value',
        'another-property': 'another value'
      })
    })


    it('publishes an event post creation', async () => {
      await operation.run(request, null)
      expect(publisher).toHaveBeenCalledWith(
        'MockModelCreated',
        expect.objectContaining({
          'some-property': 'some value',
          'another-property': 'another value'
        }),
        undefined
      )
    })


    it('fails w/ a 409 if we get a duplicate key error', async () => {
      queryBuilder.reject({
        code: '23505'
      })

      const response = await operation.run(request, null)

      expect(response.status).toBe(409)
    })

    it('returns a 500 on unhandled exceptions', async () => {
      queryBuilder.reject({
        code: 'whatever'
      })

      const response = await operation.run(request, null)

      expect(response.status).toBe(500)
    })

    it('does not publish events when the insert fails', async () => {
      queryBuilder.reject({
        code: 'whatever'
      })

      await operation.run(request, null)

      expect(publisher).not.toHaveBeenCalled()
    })
  })
})
