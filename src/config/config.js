const baseConfig = env => ({
  ENVIRONMENT_NAME: env.ENVIRONMENT_NAME,
  port: env.PORT || 5000,
  bodyLimit: '100kb',
  corsHeaders: ['Link'],
  useSwaggerValidation: true,
  database: {
    host: env.DATABASE_HOST,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD
  },
  kinesis: {
    enabled: true,
    region: 'local',
    endpoint: env.KINESIS_ENDPOINT || 'http://kinesis:4567',
    stream_name: env.KINESIS_STREAM || 'snacker-tracker',
    accessKeyId: 'daasd',
    secretAccessKey: 'daasd',
  },
})

export const Config = env => {
  const base = baseConfig(env)
  return base
}
