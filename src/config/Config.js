const baseConfig = env => ({
  ENVIRONMENT_NAME: env.ENVIRONMENT_NAME,
  port: env.PORT || 5000,
  bodyLimit: '100kb',
  corsHeaders: ['Link'],
  useSwaggerValidation: true,
  reporter_base_url: env.REPORTER_BASE_URL || 'http://full:5000/v1',
  auth: {
    authz: {
      enabled: true
    },
    authn: {
      enabled: true
    }
  },
  oauth: {
    enabled: !(env.OAUTH_ENABLED === 'false'),
    issuer: env.OAUTH_ISSUER || 'fscker-public-qa.eu.auth0.com',
    audience: env.OAUTH_AUDIENCE || 'snacker-tracker-reporter',
    client_id: env.OAUTH_CLIENT_ID || null,
    client_secret: env.OAUTH_CLIENT_SECRET || null,
  },
  s3: {
    endpoint: env.S3_ENDPOINT || 'http://s3/',
    bucket: env.S3_BUCKET || 'snacker-tracker-' + env.ENVIRONMENT_NAME,
    accessKeyId: env.AWS_ACCESS_KEY_ID || 'none',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || 'none',
    s3ForcePathStyle: true
  },
  database: {
    host: env.DATABASE_HOST,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD
  },
  kinesis: {
    enabled: true,
    region: 'local',
    iterator_type: 'LATEST',
    endpoint: env.KINESIS_ENDPOINT || 'http://kinesis:4567',
    stream_name: env.KINESIS_STREAM || 'snacker-tracker-' + env.ENVIRONMENT_NAME,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  },
  swagger: {
    validation: {
      sync: false,
      exposeResult: false
    }
  }
})

export const Config = env => {
  const base = baseConfig(env)
  if(env.ENVIRONMENT_NAME === 'dev') {
    base.swagger.validation.sync = true
    base.swagger.validation.exposeResult = true
    base.kinesis.iterator_type = 'TRIM_HORIZON'
  }
  return base
}
