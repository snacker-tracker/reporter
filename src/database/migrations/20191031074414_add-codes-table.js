const up = knex => {
  return knex.schema
    .createTable('codes', function (table) {
      table.string('code').notNullable().primary()
      table.string('name')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
}

const down = (knex) => {
  return knex.schema
    .dropTable('codes')
}

export {
  up, down
}
