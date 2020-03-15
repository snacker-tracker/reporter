import { Operation, HTTPResponse } from './Base'

import knex from 'knex'

class GetTimeseries extends Operation {
  static canBeCalledAnonymously = true

  toHttpRepresentation(item) {
    item.count = parseInt(item.count)
    return item
  }

  extract_params(req) {
    throw new Error('Not Implemented')
  }

  zip(timeseries, fill, period) {
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
  }

  hourly() {
    const fill = {}

    for( let hour = 0; hour < 24; hour++) {
      fill[hour] = 0
    }

    return fill
  }


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
  }

  periodToKey(period) {
    return {
      hourly: 'hour',
      daily: 'date',
      weekdaily: 'weekday',
      weekly: 'week'
    }[period]
  }

  async execute() {
    if (this.resources.resources == null) {
      return new HTTPResponse({
        status: 404,
        body: {
          message: 'Not Found'
        }
      })
    }

    const results = await this.resources.resources

    const times = results.map(row => row[this.periodToKey(this.args.period)])

    const bounds = [
      times[0],
      times[times.length - 1]
    ]

    const filled = this[this.args.period](bounds[0], bounds[1])

    const zipped = this.zip(results, filled, this.periodToKey(this.args.period))


    return new HTTPResponse({
      status: 200,
      body: {
        pagination: {},
        items: this.toHttpRepresentation(zipped.map( item => {
          return this.toHttpRepresentation(item)
        }))
      }
    })
  }
}

export default GetTimeseries
