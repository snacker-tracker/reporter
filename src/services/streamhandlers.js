import axios from 'axios'

import prometheus from '../services/prometheus'

import TokenProvider from '../lib/TokenProvider'
import InfoStores from '../lib/ProductInfoStores'
import { TimeSpentProxy } from '../lib/metrics/Proxies'

import metrics from './metrics'

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

  const store_time_spent = metrics.other.product_info_store_time_spent

  const dependencies = (event, handler) => {
    const log = new services.logger.constructor()

    log.setContext('event', event.event)
    log.setContext('event_id', event.id)
    log.setContext('handler', handler.name)

    const stores = {
      bigc: new InfoStores.BigCInfoStore(),
      upcdb: new InfoStores.UPCItemDBInfoStore(),
      tops: new InfoStores.TopsCoThInfoStore(),
      off: new InfoStores.OpenFoodFactsInfoStore(),
      snacker: new InfoStores.SnackerTrackerInfoStore(config.reporter_base_url, {
        axios, tokenProvider
      })
    }

    return {
      logger: log,
      productInfoStores: stores
    }
  }

  return dependencies
}

export default streamhandlers
