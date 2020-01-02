exports.up = function(knex) {
  return knex.schema.raw('CREATE EXTENSION IF NOT EXISTS ltree').table('codes', function(table) {
    table.specificType('categories', 'ltree')
  })
}

exports.down = function(knex) {
  return knex.schema.table('codes', function(table) {
    table.dropColumn('categories')
  }).raw('DROP EXTENSION ltree')
}
