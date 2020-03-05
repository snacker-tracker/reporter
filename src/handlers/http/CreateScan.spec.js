import { CreateScan } from './CreateScan'
import logger from '../../services/logger'

describe(CreateScan, () => {
  let operation
  let request

  const event_publisher = { publish: () => {} }

  beforeEach( () => {
    operation = new CreateScan({ logger, event_publisher })
    request = {
      body: {
      }
    }
  })

  describe('behaviour', () => {
    describe('params', () => {
      it('generates an id', async () => {
        await operation.extract_params(request)

        expect(operation.args.body.id).toEqual(expect.any(String))
      })

      it('sets created and updated at dates', async () => {
        await operation.extract_params(request)

        expect(operation.args).toEqual(
          expect.objectContaining({
            body: expect.objectContaining({
              created_at: expect.any(String),
              scanned_at: expect.any(String)
            })
          })
        )
      })

      it('defaults scanned at', async () => {
        const req2 = {
          ...request
        }

        delete req2.scanned_at

        await operation.extract_params(request)

        expect(operation.args).toEqual(
          expect.objectContaining({
            body: expect.objectContaining({
              scanned_at: expect.any(String)
            })
          })
        )
      })
    })
  })
})
