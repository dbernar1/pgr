exports.up = knex => knex.schema.createTable( 'stops', table => {
	table.increments();
	table.text( 'name' );
	table.text( 'image' );
	table.text( 'latitude' );
	table.text( 'longitude' );
	table.text( 'guid' ).unique();
} );

exports.down = ( knex, Promise ) => Promise.resolve();
