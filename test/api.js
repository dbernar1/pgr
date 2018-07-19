const request = require( 'supertest' );
const api = require( '../server' );
const { expect, } = require( 'chai' );
const Promise = require( 'bluebird' );

before( function() {
	this.knex = require( 'knex' )(
		require( '../knexfile' ).test
	);

	api.set( 'knex', this.knex );

	this.fabricate = ( tableName, data ) => {
		return this.knex( tableName )
		.insert( data );
	};
} );

after( function() {
	return Promise.all( [
		this.knex.destroy(),
		api.get( 'knex' ).destroy(),
	] );
} );

describe( '/remove-reported-task', function() {
	before( function() {
		return this.fabricate( 'stops', {
			name: 'Stop',
		} )
		.tap( ( [ stopId, ] ) => this.fabricate( 'stop_tasks', {
			stopId,
			taskQuest: 'Perform quest',
		} ) )
		.then( ( [ stopId, ] ) => {
			this.stopId = stopId;

			return request( api )
			.post( '/remove-reported-task' )
			.send( { id: stopId, } )
			.then( res => this.res = res );
		} );
	} );

	it( 'should respond with 204', function() {
		expect( this.res.status ).to.equal( 204 );
	} );

	it ( 'should delete the reported task', function() {
		return this.knex.select()
		.from( 'stop_tasks' )
		.where( { stopId: this.stopId, } )
		.then( stopTasks => {
			expect( stopTasks ).to.have.length( 0 );
		} );
	} );
} );
