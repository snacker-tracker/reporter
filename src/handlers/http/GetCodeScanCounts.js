import GetTimeseries from '../../lib/http/GetTimeseries'
import Scan from '../../models/Scan'

import knex from 'knex'

class GetCodeScanCounts extends GetTimeseries {
  static model = Scan
  static canBeCalledAnonymously = true

  extract_params(req) {
    this.args = {
      code: req.params.code,
      period: req.query.period,
      offset: req.query.offset,
      limit: req.query.limit,
    }
  }

  periodSpecifics(period) {
    return {
      hourly: {
        period: 'hour',
        select: knex.raw('extract(hour from "scanned_at") as hour'),
        groupBy: 'extract(hour from "scanned_at")'
      },
      weekdaily: {
        period: 'weekday',
        select: knex.raw('extract(isodow from "scanned_at") as weekday'),
        groupBy: 'extract(isodow from "scanned_at")'
      },
      daily: {
        period: 'date',
        select: knex.raw('TO_CHAR("scanned_at" :: DATE, \'yyyy-mm-dd\') as date'),
        groupBy: 'TO_CHAR("scanned_at" :: DATE, \'yyyy-mm-dd\')'
      }
    }[period]
  }

  resources() {
    return {
      resources: (async () => {
        let query = this.constructor.model.query()
        query.options({ operationId: this.constructor.name })

        query.count('id').groupBy('code')
        query.where({
          code: this.args.code
        })

        let {
          select, groupBy, period
        } = this.periodSpecifics(this.args.period)

        query.select(select)
        query.groupByRaw(groupBy)
        query.orderBy(period, 'asc')

        return await query
      })()
    }
  }
}

export { GetCodeScanCounts }
