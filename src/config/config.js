const baseConfig = env => ({
  ENVIRONMENT_NAME: env.ENVIRONMENT_NAME,
  port: process.env.PORT || 5000,
  bodyLimit: '100kb',
  corsHeaders: ['Link'],
  // we're defaulting to no, for now
  useSwaggerValidation: !env.USE_SWAGGER_VALIDATION == 'false',
  database: {
    host: env.DATABASE_HOST,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD
  },
  kinesis: {
    enabled: true,
    region: 'local',
    endpoint: "http://kinesis:4567",
    stream_name: "snacker-tracker",
    accessKeyId: 'daasd',
    secretAccessKey: 'daasd',
  },
})

export const Config = env => {
  const base = baseConfig(env)
  return base
}
