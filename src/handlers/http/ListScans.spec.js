import { ListScans } from './ListScans'
import logger from '../../services/logger'

describe(ListScans, () => {
  let operation
  let request

  const event_publisher = { publish: () => {} }

  beforeEach( () => {
    operation = new ListScans({ logger, event_publisher })
    request = {
      query: {
        location: 'somewhere'
      }
    }
  })

  describe('behaviour', () => {
    describe('params', () => {
      it('extracts `location` from query params', async () => {
        await operation.extract_params(request)

        expect(operation.args.location).toEqual('somewhere')
      })
    })
  })
})
