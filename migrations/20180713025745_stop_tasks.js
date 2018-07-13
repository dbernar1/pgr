exports.up = knex => knex.schema.createTable( 'stop_tasks', table => {
	table.increments();
	table.integer( 'stopId' );
	table.text( 'taskQuest' );
	table.timestamp( 'created_at' );
} );

exports.down = ( knex, Promise ) => Promise.resolve();
