const request = require( 'request' );
const { stopsHost, stopsLat, stopsLong, } = require( './config' );
const { pick, } = require( 'underscore' );

const knex = require( 'knex' )( {
	client: 'sqlite3',
	connection: {
		filename: './pgr.sqlite',
	},
	useNullAsDefault: true,
} );

request( stopsHost + 'nearby?latitude=' + stopsLat + '&longitude=' + stopsLong + '&max=10000', ( err, response, body ) => {
	const pokestops = JSON.parse( body ).map(
		stop => pick(
			stop,
			'name', 'image', 'latitude', 'longitude', 'guid'
		)
	);

	knex.select( 'guid' )
	.from( 'stops' )
	.whereIn( 'guid', pokestops.map( stop => stop.guid ) )
	.then( existingStops => {
		const existingStopGuids = existingStops.map( stop => stop.guid );

		return knex( 'stops' )
		.insert( pokestops.filter(
			fetchedStop => ! existingStopGuids.includes( fetchedStop.guid )
		) );
	} )
	.then( () => {
		console.log( 'loaded' )
	} );
} );
