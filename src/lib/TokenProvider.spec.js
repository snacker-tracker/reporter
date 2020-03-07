import TokenProvider from './TokenProvider'

describe(TokenProvider, () => {
  const config = {
    issuer: 'https://my-oidc-issuer.com',
    endpoints: {
      token: '/oauth/token'
    },
    client_id: 'my-client-id',
    client_secret: 'super-secret-value'
  }

  let tokenProvider
  let axios = {}

  beforeEach( () => {
    axios.post = jest.fn()
    axios.post.mockResolvedValue({
      data: {
        access_token: 'default-token',
        scope: 'scope1 scope2',
        expires_in: 86400,
        token_type: 'Bearer'
      }
    })

    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'the-first-token',
        scope: 'scope1 scope2',
        expires_in: 86400,
        token_type: 'Bearer'
      }
    })

    axios.create = jest.fn()
    axios.create.mockReturnValue(axios)

    tokenProvider = new TokenProvider(
      config, { axios }
    )
  })

  describe('configuration', () => {
    it('sets the right issuer url', async () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: config.issuer
        })
      )
    })

    it('makes a call to the configured token endpoint', async () => {
      await tokenProvider.getToken()

      expect(axios.post).toHaveBeenCalledWith(
        config.endpoints.token,
        expect.any(Object)
      )
    })

    it('uses the client_credentials grant type', async () => {
      await tokenProvider.getToken()

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          client_secret: config.client_secret
        })
      )
    })


    it('uses the correct client id', async () => {
      await tokenProvider.getToken()

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          client_id: config.client_id
        })
      )
    })

    it('uses the correct client secret', async () => {
      await tokenProvider.getToken()

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          client_secret: config.client_secret
        })
      )
    })

    describe('audiences', () => {
      it('specifies audience if provided', async () => {
        tokenProvider = new TokenProvider(
          { ...config, audience: 'my-audience' }, { axios }
        )

        await tokenProvider.getToken()

        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            audience: 'my-audience'
          })
        )
      })

      it('does not provide audience when it is not provided', async () => {
        await tokenProvider.getToken()

        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.not.objectContaining({
            audience: 'my-audience'
          })
        )
      })
    })
  })

  describe('returns', () => {
    it('returns a token', async () => {
      const token = await tokenProvider.getToken()
      expect(token).toBe('the-first-token')
    })

    it('caches tokens', async () => {
      await tokenProvider.getToken()
      const token = await tokenProvider.getToken()
      expect(token).toBe('the-first-token')
    })

    describe('cache expiry', () => {
      it('gets a new token if we never had one', async () => {
        tokenProvider.cache = {
          token: false
        }
        await tokenProvider.getToken()
        const token = await tokenProvider.getToken()
        expect(token).toBe('the-first-token')
      })

      it('gets a new token if expired', async () => {
        tokenProvider.cache = {
          token: 'an-expired-token',
          expiry: new Date() - 10000
        }

        await tokenProvider.getToken()
        const token = await tokenProvider.getToken()
        expect(token).toBe('the-first-token')
        expect(axios.post).toHaveBeenCalled()
      })

      it('gets a new token if expired', async () => {
        tokenProvider.cache = {
          token: 'the-first-token',
          expiry: new Date() + 10000
        }

        await tokenProvider.getToken()
        const token = await tokenProvider.getToken()
        expect(token).toBe('the-first-token')
        expect(axios.post).not.toHaveBeenCalled()
      })


    })

  })
})
