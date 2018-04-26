try {
	const config = require('../config/config.json');
	const incheon = require('../incheon.js');

	incheon.init(config);
	incheon.start({backupTest: true});

} catch(err) {
	console.log(err);
	console.log('\nCaught top-level exception in Incheon,\nStarting Incheon Recovery/Backup Utility...');

	const config = require('./config/config.json'),
	      util = require('./util/util'),
	      wsProtocol = require('./util/wsprotocol'),
	      Connection = require('./models/connection');

	config.error = {
		err,
		time: new Date().toUTCString()
	};

	const uws = require('uws');

	let connectedUsers = new Map();
	const server = new uws.Server({port: config.port});

	server.on('connection', conn => {
		const connId = util.generateV4();
		const connection = new Connection(connId, conn);

		connectedUsers.set(connId, connection);

		conn.send(JSON.stringify({
			type: 'message',
			response: 'Welcome to the Incheon recovery/backup websocket utility.\nHopefully this isn\'t seen often, otherwise there is an issue with code reviews and/or testing.'
		}));

		conn.send(JSON.stringify({
			type: 'protocol',
			response: 'incheon-recovery'
		}));

		conn.on('close', () => {
			connectedUsers.delete(connId);
		});

		conn.on('message', (message) => {
			message = JSON.parse(message);
			switch(message.type) {
				case 'auth':
					wsProtocol.auth(connection, message, config);
					break;
				case 'servererror':
					wsProtocol.servererror(connection, message, config);
					break;
				case 'ping':
					wsProtocol.ping(conn);
					break;
			}
		});
	});

	console.log(`Utility listening on port ${config.port}`);
}