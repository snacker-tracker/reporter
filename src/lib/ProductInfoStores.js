import axios from 'axios'
import FormData from 'form-data'

class SnackerTrackerInfoStore {
  constructor(base_url, options = {}) {
    this.base_url = base_url
  }
  async get(code) {
    try {
      const response = await axios.get(
        this.base_url + '/codes/' + code
      )

      return response.data
    } catch( error ) {
      return false
    }
  }

  async post(code_and_info) {
    const response = await axios.post(
      [this.base_url, 'codes'].join('/'),
      code_and_info
    )

    return response.data
  }

  async post_picture(code, buffer) {
    const form = new FormData()
    form.append('picture', buffer, {
      filename: 'picture',
      contentType: 'image/jpeg'
    })

    const response = await axios.post(
      [this.base_url, 'codes', code, 'pictures'].join('/'),
      form,
      {
        headers: form.getHeaders()
      }
    )

    return response.data

  }
}

class OpenFoodFactsInfoStore {
  async get(code) {
    // https://world.openfoodfacts.org/api/v0/product/8850999220000.json
    try {
      const response = await axios.get(
        'https://world.openfoodfacts.org/api/v0/product/' + code + '.json'
      )

      if(response.data.status === 0) {
        return false
      }

      return response.data
    } catch( error ) {
      console.log(error)
      return false
    }
  }
}

class UPCItemDBInfoStore {
  async get(code) {
    try {
      const response = await axios.get(
        'https://api.upcitemdb.com/prod/trial/lookup',
        {
          params: {
            upc: code
          }
        }
      )

      console.log(JSON.stringify(response.headers, null, 2))
      console.log(JSON.stringify(response.data, null, 2))

      return response.data

    } catch(error) {
      console.log('Failed to query the UPC database')
      return false
    }

  }
}

class BigCInfoStore {
  async get(code) {
    let bigc_result
    try {
      bigc_result = await axios.get(
        'https://www.bigc.co.th/sb.php',
        {
          params: {
            q: code,
            storeid: 1,
            currencycode: 'THB'
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'User-agent': 'Mozilla Firefox'
          }
        }
      )

      if(bigc_result.data.response) {
        if(bigc_result.data.response.numFound > 0) {
          return bigc_result.data.response.docs[0]
        }
      }

      return false
    } catch(error) {
      console.log(error)
      console.log({
        message: 'read local ...',
        status: error.response.status,
        headers: error.response.headers
      })

      return false
    }
  }
}


export default {
  BigCInfoStore,
  OpenFoodFactsInfoStore,
  UPCItemDBInfoStore,
  SnackerTrackerInfoStore
}
