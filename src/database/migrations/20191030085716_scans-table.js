const up = knex => {
  return knex.schema
    .createTable('scans', function (table) {
      table.uuid('id').primary()
      table.string('code').notNullable()
      table.timestamp('scanned_at').notNullable()
      table.timestamp('recorded_at').notNullable()
    })
}

const down = (knex, Promise) => {
  return knex.schema
    .dropTable('scans')
}

export { up, down }
