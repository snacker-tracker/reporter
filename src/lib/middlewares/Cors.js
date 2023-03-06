import cors from 'cors'
import Middleware from './Middleware'

class Cors extends Middleware {
  handler = cors()
}

export default Cors
