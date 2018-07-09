const request = require( 'request' );
const fs = require( 'fs' );
const { stopsHost, stopsLat, stopsLong, } = require( 'config' );

request( stopsHost + 'nearby?latitude=' + stopsLat + '&longitude=' + stopsLong + '&max=10000', ( err, response, body ) => {
	const pokestops = JSON.parse( body );

	fs.writeFileSync(
		'./pokestops.json',
		JSON.stringify(
			pokestops,
			[ 'name', 'image', 'latitude', 'longitude', ],
			2
		),
		'utf8'
	);
} );
