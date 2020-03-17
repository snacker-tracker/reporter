import FormData from 'form-data'

import ProductInfoStore from './ProductInfoStore'

class SnackerTrackerInfoStore extends ProductInfoStore {
  async get(code) {
    try {
      const response = await this.execute({
        method: 'get',
        url: ['codes', code].join('/'),
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      return response.data
    } catch( error ) {
      return false
    }
  }

  async post(code_and_info) {
    try {
      const response = await this.execute({
        method: 'post',
        url: ['codes'].join('/'),
        payload: code_and_info
      })

      return response.data

    } catch(error) {
      console.log(error)
      throw error
    }
  }

  async patch(code, payload) {
    const response = await this.execute({
      method: 'patch',
      url: ['codes', code].join('/'),
      payload,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    return response.data
  }

  async post_picture(code, buffer) {
    const form = new FormData()
    form.append('picture', buffer, {
      filename: 'picture',
      contentType: 'image/jpeg'
    })

    const response = await this.execute({
      method: 'post',
      url: ['codes', code, 'pictures'].join('/'),
      payload: form,
      headers: form.getHeaders()
    })

    return response.data
  }

  async get_pictures(code) {
    try {
      const response = await this.execute({
        method: 'get',
        url: ['codes', code, 'pictures'].join('/'),
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      return response.data.items
    } catch( error ) {
      return false
    }
  }
}


export default SnackerTrackerInfoStore
