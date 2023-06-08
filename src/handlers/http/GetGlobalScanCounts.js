import GetTimeseries from '../../lib/http/GetTimeseries'
import Scan from '../../models/Scan'

import { raw } from 'objection'

class GetGlobalScanCounts extends GetTimeseries {
  static model = Scan
  static canBeCalledAnonymously = true

  extract_params(req) {
    this.args = {
      period: req.query.period,
      offset: req.query.offset,
      limit: req.query.limit,
    }
  }

  resources() {
    return {
      resources: (async () => {
        let query = this.constructor.model.query()
        query.options({ operationId: this.constructor.name })

        query.count('id')

        let select
        let groupBy
        let period

        switch(this.args.period) {
          case 'hourly':
            period = 'hour'
            select = raw('extract(hour from "scanned_at") as ' + period)
            groupBy = 'extract(' + period + ' from "scanned_at")'
            break

          case 'weekly':
            period = 'week'
            select = raw('to_char(scanned_at, \'IYYY-IW\') as week')
            groupBy = 'to_char(scanned_at, \'IYYY-IW\')'
            break

          case 'weekdaily':
            period = 'weekday'
            select = raw('extract(isodow from "scanned_at") as ' + period)
            groupBy = 'extract(isodow from "scanned_at")'
            break

          case 'daily':
            period = 'date'
            select = raw('TO_CHAR("scanned_at" :: DATE, \'yyyy-mm-dd\') as ' + period)
            groupBy = 'TO_CHAR("scanned_at" :: DATE, \'yyyy-mm-dd\')'
            break
        }

        query.select(select)
        query.groupByRaw(groupBy)
        query.orderBy(period, 'asc')

        return await query
      })()
    }
  }
}

export { GetGlobalScanCounts }
