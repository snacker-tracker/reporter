import cors from 'cors'
import Middleware from './Middleware'

const handler = cors()

class Cors extends Middleware {
  handler = cors()
}

export default Cors
