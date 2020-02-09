import ListOperation from '../../lib/http/ListOperation'
import { Scan } from '../../models'

import knex from 'knex'

class GetGlobalScanCounts extends ListOperation {
  static model = Scan
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    item.count = parseInt(item.count)
    return item
  }

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

        const fillers = {
          weekly(start, end) {
            start = start.split('-').map(parseInt)
            end = end.split('-').map(parseInt)

            const weeks = {}

            for(let year = start[0]; year <= end[0]; year++) {
              let startWeek = 1
              let endWeek = 52
              if(year === start[0]) {
                startWeek = start[1]
              } else if (year === end[0]) {
                startWeek = end[1]
              }

              for(let week = startWeek; week <= endWeek; week++) {
                weeks[ [year, week].map( period => period.toString() ).join('-') ] = 0
              }
            }

            return weeks
          },

          daily(start, end) {
            start = new Date(start)
            end = new Date(end)

            const fill = []

            for( let starting = start; starting <= end; starting.setTime( starting.getTime() + 1 * 86400000 ) ) {
              fill.push(new Date(starting))
            }

            return fill
              .map( date => date.toISOString().split('T')[0])
              .reduce( ( accumulator, current ) => {
                accumulator[current] = 0
                return accumulator
              }, {})
          },

          hourly() {
            const fill = {}

            for( let hour = 0; hour < 24; hour++) {
              fill[hour] = 0
            }

            return fill
          },

          weekdaily() {
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

          case 'weekly':
            period = 'week'
            select = knex.raw('to_char(scanned_at, \'IYYY-IW\') as week')
            groupBy = 'to_char(scanned_at, \'IYYY-IW\')'
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

        const times = results.map(row => row[period])

        const bounds = [
          times[0],
          times[times.length - 1]
        ]

        const fill = fillers[this.args.period](bounds[0], bounds[1])

        const zip = (timeseries, fill) => {
          for( const entry of timeseries ) {
            fill[entry[period]] = entry.count
          }

          return Object.entries(fill).map( entry => {
            const point = {
              count: entry[1]
            }

            if(['hour', 'weekday'].includes(period)) {
              point[period] = parseInt(entry[0])
            } else {
              point[period] = entry[0]
            }

            return point
          })
        }

        return zip(results, fill)
      })()
    }
  }
}

export { GetGlobalScanCounts }
