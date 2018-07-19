const api = require( './server' );

api.listen( api.get( 'port' ), () => {
	console.log( "I'm listening." );
} );
