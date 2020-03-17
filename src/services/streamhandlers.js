import axios from 'axios'

import TokenProvider from '../lib/TokenProvider'
import InfoStores from '../lib/stores/'

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

  const dependencies = (event, handler) => {
    const log = new services.logger.constructor()

    log.setContext('event', event.event)
    log.setContext('event_id', event.id)
    log.setContext('handler', handler.name)

    const stores = {
      bigc: new InfoStores.BigCInfoStore('https://www.bigc.co.th/', { axios }),
      upcdb: new InfoStores.UPCItemDBInfoStore('https://api.upcitemdb.com/', { axios }),
      tops: new InfoStores.TopsCoThInfoStore('https://www.tops.co.th/', { axios }),
      off: new InfoStores.OpenFoodFactsInfoStore('https://world.openfoodfacts.org/', { axios }),
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
