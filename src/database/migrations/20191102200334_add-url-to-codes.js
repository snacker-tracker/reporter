exports.up = function(knex) {
  return knex.schema.table('codes', function(t) {
    t.string('url')
  })
}

exports.down = function(knex) {
  return knex.schema.table('codes', function(t) {
    t.dropColumn('url')
  })
}
