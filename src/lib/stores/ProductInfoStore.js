class ProductInfoStore {
  constructor(base_url, options = {}) {
    Object.assign(this, options)

    this.axios = options.axios.create({
      baseURL: base_url
    })
  }

  firstOf(options, hash) {
    for(const option of options) {
      if(hash[option] != undefined && hash[option] != '' && hash[options] != 'unknown') {
        return hash[option]
      }
    }
  }

  async get(code) {
    const request = this.build_get_request(code)
    const response = await this.execute(request)
    return this.map_object(code, response)
  }

  async execute(request) {
    const headers = request.headers || {}
    if(this.tokenProvider) {
      const token = await this.tokenProvider.getToken()
      headers['Authorization'] = ['Bearer', token].join(' ')
    }

    const axios_params = [request.url]

    if(request.method !== 'get') {
      axios_params.push(request.payload)
    }

    axios_params.push({
      params: request.params,
      headers
    })

    return this.axios[request.method].apply(this.axios, axios_params)
  }
}

export default ProductInfoStore
