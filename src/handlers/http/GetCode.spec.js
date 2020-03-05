import { GetCode } from './GetCode'
import logger from '../../services/logger'

describe(GetCode, () => {
  let operation
  let request

  const event_publisher = { publish: () => {} }

  beforeEach( () => {
    operation = new GetCode({ logger, event_publisher })
    request = {
      params: {
        code: 'deadbeef'
      }
    }
  })

  describe('behaviour', () => {
    describe('input', () => {
      it('gets it from the request', async () => {
        await operation.extract_params(request)

        expect(operation.args.id).toEqual('deadbeef')
      })
    })

    describe('output', () => {
      it('leaves url intact if not null', () => {
        const item  = {
          'url': 'asdasd'
        }

        const mapped = operation.toHttpRepresentation(item)

        expect(mapped).toEqual({ categories: [], url: 'asdasd' })
      })

      it('removes URL if it is null', () => {
        const item  = {
          'url': null
        }

        const mapped = operation.toHttpRepresentation(item)

        expect(mapped).toEqual({ categories: [] })
      })

      it('splits categories into an array', () => {
        const item  = {
          'categories': 'one.two'
        }

        const mapped = operation.toHttpRepresentation(item)


        expect(mapped.categories).toEqual(
          expect.arrayContaining([
            'one', 'two'
          ])
        )
      })
    })
  })
})
