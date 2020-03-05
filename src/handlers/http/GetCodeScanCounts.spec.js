import { GetCodeScanCounts } from './GetCodeScanCounts'
import logger from '../../services/logger'

describe(GetCodeScanCounts, () => {
  let operation
  let request

  const event_publisher = { publish: () => {} }

  beforeEach( () => {
    operation = new GetCodeScanCounts({ logger, event_publisher })
    request = {
      params: {
        code: 'deadbeef'
      },
      query: {
        period: 'some-period',
        offset: 0,
        limit: 100
      }
    }
  })

  describe('behaviour', () => {
    describe.only('input', () => {
      it('gets code from the request', async () => {
        await operation.extract_params(request)

        expect(operation.args.code).toEqual('deadbeef')
      })

      it('gets period from the request', async () => {
        await operation.extract_params(request)

        expect(operation.args.code).toEqual('deadbeef')
      })

      it('gets offset from the request', async () => {
        await operation.extract_params(request)

        expect(operation.args.offset).toEqual(0)
      })

      it('gets limit from the request', async () => {
        await operation.extract_params(request)

        expect(operation.args.limit).toEqual(100)
      })

    })

    describe('behaviour', () => {
      it('queries using the right code', async () => {
        await operation.run(request)
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
