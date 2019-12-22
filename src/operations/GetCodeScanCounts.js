import ListOperation from '../lib/ListOperation'
import { Scan } from '../models'

import knex from 'knex'

class GetCodeScanCounts extends ListOperation {
  static model = Scan
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    item.count = parseInt(item.count)
    return item
  }

  extract_params(req) {
    this.args = {
      code: req.params.code,
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

        query.count('id').groupBy('code')
        query.where({
          code: this.args.code
        })

        let select
        let groupBy
        let period

        const fillers = {
          daily(start, end) {
            start = new Date(start)
            end = new Date(end)

            const fill = []

            for( let s = start; s <= end; s.setTime( s.getTime() + 1 * 86400000 ) ) {
              fill.push(new Date(s))
            }

            return fill
              .map( date => date.toISOString().split('T')[0])
              .reduce( ( accumulator, current ) => {
                accumulator[current] = 0
                return accumulator
              }, {})
          },

          hourly(start, end) {
            const fill = {}

            for( let h = 0; h < 24; h++) {
              fill[h] = 0
            }

            return fill
          },

          weekdaily(start, end) {
            return {
              0: 0,
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
              6: 0
            }
          }
        }

        switch(this.args.period) {
          case 'hourly':
            period = 'hour'
            select = knex.raw('extract(hour from "scanned_at") as ' + period)
            groupBy = 'extract(' + period + ' from "scanned_at")'
            break
          case 'weekdaily':
            period = 'weekday'
            select = knex.raw('extract(isodow from "scanned_at") as ' + period)
            groupBy = 'extract(isodow from "scanned_at")'
            break

          case 'daily':
            period = 'date'
            select = knex.raw('TO_CHAR("scanned_at" :: DATE, \'yyyy-mm-dd\') as ' + period)
            groupBy = 'TO_CHAR("scanned_at" :: DATE, \'yyyy-mm-dd\')'
            break
        }

        query.select(select)
        query.groupByRaw(groupBy)
        query.orderBy(period, 'asc')

        const results = await query

        const asHash = results.reduce( (accumulator, current) => {
          accumulator[current[period]] = current['count']

          return accumulator
        }, {} )

        const times = results.map(row => row[period])

        const bounds = [
          times[0],
          times[times.length - 1]
        ]

        const fill = fillers[this.args.period](bounds[0], bounds[1])

        const zip = (timeseries, fill) => {
          for( const e of timeseries ) {
            fill[e[period]] = e.count
          }

          return Object.entries(fill).map( e => {
            const point = {
              count: e[1]
            }

            if(['hour', 'weekday'].includes(period)) {
              point[period] = parseInt(e[0])
            } else {
              point[period] = e[0]
            }

            return point
          })
        }


        return zip(results, fill)
      })()
    }
  }
}

export { GetCodeScanCounts }
