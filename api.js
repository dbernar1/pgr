const { port, logRequests, stopsHost, } = require( './config.js' );
const express = require( 'express' );
const api = express();
const tasks = require( './tasks' );
const bodyParser = require( 'body-parser' );
const Promise = require( 'bluebird' );
const knex = require( 'knex' )( {
	client: 'sqlite3',
	connection: {
		filename: './pgr.sqlite',
	},
	useNullAsDefault: true,
} );
const { findWhere, extend, pick, } = require( 'underscore' );
const moment = require( 'moment' );
const request = require( 'request' );

const findClosestStops = ( latitude, longitude, limit=3 ) => {
	return knex.select( 'stops.*', 'stop_tasks.taskQuest', )
	.from( 'stops' )
	.joinRaw( 'LEFT JOIN stop_tasks ON stops.id = stop_tasks.stopId AND stop_tasks.id IN ( SELECT MAX( id ) FROM stop_tasks GROUP BY stopId )' )
	.orderByRaw( 'abs( latitude - ' + latitude + ') + abs( longitude - ' + longitude + ') ASC' )
	.limit( limit );
};

api.use( bodyParser.json() );

if ( logRequests ) {
	api.use( require( 'morgan' )( 'combined' ) );
}

api.use( express.static( 'static' ) );

api.get( '/stops/:latitude/:longitude', ( req, res, next ) => {
	findClosestStops( req.params.latitude, req.params.longitude )
	.then( stops => {
		console.log( stops );
		res.json( stops )
	} )
	.catch( next );
} );

api.get( '/tasks', ( req, res, next ) => {
	const singleRewardTasks = tasks.filter( task => 'string' === typeof task.reward );
	res.json( singleRewardTasks );
} );

api.post( '/tasks', ( req, res, next ) => {
	knex( 'stop_tasks' )
	.insert( extend( { created_at: moment().format() }, req.body ) ) 
	.then( () => res.sendStatus( 201 ) )
	.catch( next );
} );

api.get( '/load-nearby/:latitude/:longitude', ( req, res, next ) => {
	const { latitude, longitude } = req.params;

	request( stopsHost + 'nearby?latitude=' + latitude + '&longitude=' + longitude + '&max=10000', ( err, response, body ) => {
		if ( err ) { return next( err ); }

		const pokestops = JSON.parse( body ).map(
			stop => pick(
				stop,
				'name', 'image', 'latitude', 'longitude', 'guid'
			)
		);
		console.log( 'Fetched ' + pokestops.length );

		knex.select( 'guid' )
		.from( 'stops' )
		.whereIn( 'guid', pokestops.map( stop => stop.guid ) )
		.then( existingStops => {
			const existingStopGuids = existingStops.map( stop => stop.guid );
			console.log( 'Existing ' + existingStopGuids.length );

			const newStops = pokestops.filter(
				fetchedStop => ! existingStopGuids.includes( fetchedStop.guid )
			);

			if ( newStops.length > 0 ) {
				return knex( 'stops' )
				.insert( newStops );
			}
		} )
		.then( () => {
			return findClosestStops( latitude, longitude )
			.then( stops => {
				console.log( stops );
				res.json( stops )
			} )
		} )
		.catch( next );
	} );
} );

api.get( '/map', ( req, res, next ) => {
	res.sendFile( __dirname + '/map.html' );
} );

api.get( '/map/stops/:latitude/:longitude', ( req, res, next ) => {
	findClosestStops( req.params.latitude, req.params.longitude, 30 )
	.then( stops => {
		res.json( stops.map( stop => {
			return extend( {}, stop, {
				icon: stop.taskQuest
					? ( 'Poo' === stop.taskQuest
						? 'Poo'
						: findWhere( tasks, { quest: stop.taskQuest, } ).reward
					)
					: null,
			} );
		} ) )
	} )
	.catch( next );

} );

api.listen( port, () => {
	console.log( "I'm listening." );
} );
