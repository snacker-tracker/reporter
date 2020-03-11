import axios from 'axios'

import prometheus from '../services/prometheus'

import TokenProvider from '../lib/TokenProvider'
import InfoStores from '../lib/ProductInfoStores'
import { TimeSpentProxy } from '../lib/metrics/Proxies'

import metrics from '../services/metrics'

const streamhandlers = (config, services) => {

  services.prometheus.register.registerMetric(metrics.other.product_info_store_time_spent)

  const tokenProvider = new TokenProvider(
    {
      issuer: 'https://' + config.oauth.issuer,
      client_id: config.oauth.client_id,
      client_secret: config.oauth.client_secret,
      audience: config.oauth.audience,
      endpoints: {
        token: '/oauth/token'
      }
    }, {
      axios
    }
  )


  const dependencies = (event, handler) => {
    const log = new services.logger.constructor()

    log.setContext('event', event.event)
    log.setContext('event_id', event.id)
    log.setContext('handler', handler.name)

    const bigc = new InfoStores.BigCInfoStore()
    const upcdb = new InfoStores.UPCItemDBInfoStore()
    const off = new InfoStores.OpenFoodFactsInfoStore()
    const snacker = new InfoStores.SnackerTrackerInfoStore(config.reporter_base_url, {
      axios, tokenProvider
    })
    const tops = new InfoStores.TopsCoThInfoStore()


    return {
      logger: log,
      productInfoStores: {
        bigc: new TimeSpentProxy(bigc, metrics.other.product_info_store_time_spent),
        upcdb: new TimeSpentProxy(upcdb, metrics.other.product_info_store_time_spent),
        off: new TimeSpentProxy(off, metrics.other.product_info_store_time_spent),
        snacker: new TimeSpentProxy(snacker, metrics.other.product_info_store_time_spent),
        tops: new TimeSpentProxy(tops, metrics.other.product_info_store_time_spent)
      }
    }

  }
}

export default streamhandlers
