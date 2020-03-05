import Middleware from './Middleware'
//import cors from 'cors'


class HealthCheck extends Middleware {
  handler(req, res) {
    res.status(200).json('ok')
  }
}


export default HealthCheck
