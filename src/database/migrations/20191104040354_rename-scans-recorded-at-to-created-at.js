
exports.up = function(knex) {
  return knex.schema.table('scans', function(table) {
    table.renameColumn('recorded_at', 'created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.table('scans', function(table) {
    table.renameColumn('created_at', 'recorded_at');
  });
};
