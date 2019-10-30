// Update with your config settings.

import config from '../config'

const defaults = {
  client: 'postgres',
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
}

const development = {
  ...defaults,
  connection: config.database
}

const qa = development
const staging = development
const production = development

export {
  development,
  qa,
  staging,
  production
}
