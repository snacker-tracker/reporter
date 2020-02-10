import KinesisConsumer from './KinesisConsumer'
import KinesisIteratorFake from './KinesisIteratorFake'

import logger from '../logger'

class TestEventHandler2 {
  run = jest.fn()
}

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


describe(KinesisConsumer, () => {
  let iterator
  let consumer
  let dependencyProvider

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


    const dependencies = (event, handler) => {
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
