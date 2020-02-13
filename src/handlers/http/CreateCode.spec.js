import { CreateCode } from './CreateCode'
import logger from '../../lib/logger'

describe(CreateCode, () => {
  let operation
  let request

  const event_publisher = { publish: () => {} }

  beforeEach( () => {
    operation = new CreateCode({ logger, event_publisher })
    request = {
      body: {
        'some-property': 'some value',
        'another-property': 'another value',
        'categories': ['with spaces', 'with-dashes']
      }
    }
  })

  describe('behaviour', () => {
    describe('params', () => {
      it('merges body params into the args', async () => {
        await operation.extract_params(request)

        expect(operation.args).toEqual(
          expect.objectContaining({
            body: expect.objectContaining({
              'some-property': 'some value',
              'another-property': 'another value',
              created_at: expect.any(String),
              updated_at: expect.any(String)
            })
          })
        )
      })

      it('sets created and updated at dates', async () => {
        await operation.extract_params(request)

        expect(operation.args).toEqual(
          expect.objectContaining({
            body: expect.objectContaining({
              created_at: expect.any(String),
              updated_at: expect.any(String)
            })
          })
        )
      })

      describe('categories', () => {
        it('defaults categories to an empty array if it is not truthy', async () => {
          await operation.extract_params({
            body: {
              categories: false
            }
          })

          expect(operation.args.body).toEqual(
            expect.objectContaining({ categories: '' })
          )
        })

        it('replaces dashes and spaces in categories', async () => {
          await operation.extract_params(request)

          expect(operation.args).toEqual(
            expect.objectContaining({
              body: expect.objectContaining({
                categories: 'with_spaces.with_dashes'
              })
            })
          )
        })
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
