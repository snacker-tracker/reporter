import { Model } from 'objection'

import Scan from '../models/Scan'
import Code from '../models/Code'

import connection from '../database/knex'

Model.knex(connection)


export { Scan, Code }
