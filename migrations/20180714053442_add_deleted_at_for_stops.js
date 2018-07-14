exports.up = knex => knex.schema.table( 'stops', table => {
	table.timestamp( 'deleted_at' );
} );

exports.down = ( knex, Promise ) => Promise.resolve();
