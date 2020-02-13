import { CreateCodePicture } from './CreateCodePicture'
import logger from '../../lib/logger'

describe(CreateCodePicture, () => {
  let operation
  let request
  let image_repository = {}
  let publisher
  let warn

  const event_publisher = { publish: () => {} }

  beforeEach( () => {
    image_repository.put = jest.fn()
    image_repository.put.mockResolvedValue({
    })

    publisher = jest.spyOn(event_publisher, 'publish')

    warn = jest.spyOn(logger, 'warn')
    warn.mockReturnValue(true)

    operation = new CreateCodePicture({ logger, event_publisher, image_repository })
    request = {
      params: {
        code: 'some-code'
      },
      files: [
        {
          buffer: 'a jpg image',
          mimetype: 'image/jpeg',
          size: 42
        }
      ],
      headers: {
        host: 'example.com'
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
              'code': 'some-code',
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
    })

    describe('side effects', () => {
      describe('event stream', () => {
        it('puts an event down', async () => {
          await operation.run(request)

          expect(publisher).toHaveBeenCalledWith(
            'CodePictureCreated',
            expect.objectContaining({
              id: 'c872c7ae6479e9b640a06a85a9d22eb93d80fdae7fd625e02d038592c286d21c',
              code: 'some-code'
            }),
            undefined
          )
        })
      })

      it('puts an image using a sha256 as a name', async () => {
        await operation.run(request)

        expect(image_repository.put).toHaveBeenCalledWith(
          'some-code/c872c7ae6479e9b640a06a85a9d22eb93d80fdae7fd625e02d038592c286d21c.jpeg',
          'a jpg image'
        )
      })

      it('logs something if the upload fails', async () => {
        image_repository.put.mockRejectedValue('asd')
        await operation.run(request)
        expect(warn).toHaveBeenCalled()
      })
    })

    describe('output', () => {
      it('includes the size of the image', async () => {
        const response = await operation.run(request)

        expect(response.body.size).toEqual(42)
      })

      it('includes the hash', async () => {
        const response = await operation.run(request)

        expect(response.body.id).toEqual('c872c7ae6479e9b640a06a85a9d22eb93d80fdae7fd625e02d038592c286d21c')
      })

      it('includes a date modified', async () => {
        const response = await operation.run(request)

        expect(response.body.last_modified).toEqual(expect.any(String))
      })

      it('returns a 201', async () => {
        const response = await operation.run(request)

        expect(response.status).toEqual(201)
      })


    })
  })
})
