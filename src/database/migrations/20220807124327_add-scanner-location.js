exports.up = async function(knex, Promise) {
  await knex.schema.table('scans', function(t) {
    t.string('location')
  })

  return knex.raw("UPDATE scans set location = 'thailand:bangkok'")
}

exports.down = function(knex, Promise) {
  return knex.schema.table('scans', function(t) {
    t.dropColumn('location')
  })
}
