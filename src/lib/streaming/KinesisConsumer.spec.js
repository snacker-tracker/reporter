import KinesisConsumer from './KinesisConsumer'
import KinesisIteratorFake from './KinesisIteratorFake'

const runMock = jest.fn()

const TestEventHandler = jest.fn()
TestEventHandler.mockImplementation(() => {
  return {
    run: runMock
  }
})

const runMockTwo = jest.fn()
const TestEventHandlerTwo = jest.fn()
TestEventHandlerTwo.mockImplementation(() => {
  return {
    run: runMockTwo
  }
})

class MockLogger {
  info() {

  }

  warn() {

  }

  debug() {

  }

  error() {

  }

  setContext() {

  }
}

describe(KinesisConsumer, () => {
  let iterator
  let consumer
  let dependencyProvider
  let loggerSpy = {}
  let logger

  const codes = [
    'deadbeef-1'
  ]

  const records = codes.map( code => {
    return {
      id: 'some-kind-of-uuid',
      event: 'ExampleEvent',
      payload: {
        code
      }
    }
  })

  beforeEach( () => {
    TestEventHandler.mockClear()
    runMock.mockClear()

    TestEventHandlerTwo.mockClear()
    runMockTwo.mockClear()

    iterator = new KinesisIteratorFake()
    iterator.setRecords(records)

    dependencyProvider = jest.fn()
    dependencyProvider.mockReturnValue({
      'a database': 'blah'
    })

    logger = new MockLogger()

    loggerSpy.error = jest.spyOn(logger, 'error')
    loggerSpy.error.mockReturnValue(true)

    loggerSpy.info = jest.spyOn(logger, 'info')
    loggerSpy.info.mockReturnValue(true)

    loggerSpy.warn = jest.spyOn(logger, 'warn')
    loggerSpy.warn.mockReturnValue(true)


    const dependencies = () => {
      return {
        something: 'a fake dependency'
      }
    }

    consumer = new KinesisConsumer(iterator, { logger })
    consumer.setHandlerDependencies(dependencies)
    consumer.setHandlers({
      'ExampleEvent': [TestEventHandler, TestEventHandlerTwo]
    })

  })

  describe('behaviour', () => {
    describe('getting records', () => {
      it('uses the iterator as an iterator', async () => {
        const recordsSpy = jest.spyOn(iterator, 'records')

        await consumer.start()

        expect(recordsSpy).toHaveBeenCalled()
      })
    })

    describe('processing records', () => {
      it('logs a message when theres invalid JSON', async () => {
        iterator.setRecordsRaw([{
          Data: 'INVALID JSON'
        }])

        await consumer.start()

        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.objectContaining({
            msg: 'failed to parse JSON'
          })
        )
      })

      describe('handler instantiation', () => {
        describe('first event handler', () => {
          it('creates a new instance of the handler', async () => {
            await consumer.start()

            expect(TestEventHandler.mock.instances.length).toBe(1)
          })

          it('passes the dependencies to the constructor', async () => {
            await consumer.start()

            expect(TestEventHandler).toHaveBeenCalledWith({
              something: 'a fake dependency'
            })
          })

          it('calls the run method with the event', async () => {
            await consumer.start()

            expect(runMock).toHaveBeenCalledWith(
              expect.objectContaining(records[0])
            )
          })
        })

        describe('second event handler', () => {
          it('creates a new instance of the handler', async () => {
            await consumer.start()

            expect(TestEventHandlerTwo.mock.instances.length).toBe(1)
          })

          it('passes the dependencies to the constructor', async () => {
            await consumer.start()

            expect(TestEventHandler).toHaveBeenCalledWith({
              something: 'a fake dependency'
            })
          })

          it('calls the run method with the event', async () => {
            await consumer.start()

            expect(runMockTwo).toHaveBeenCalledWith(
              expect.objectContaining(records[0])
            )
          })
        })
      })
    })
  })
})
