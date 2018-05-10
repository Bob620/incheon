function startIncheon() {
	try {
		const config = require('../config/config.json');
		const incheon = require('../incheon.js');

		incheon.init(config);
		incheon.start({forceError: config.forceError});
	} catch(err) {
		onFail(err);
	}
}

function onFail(err) {
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

		connection.sendMessage('protocol',
			'incheon-recovery'
		);

		connection.sendMessage('message',
			'Welcome to the Incheon recovery/backup websocket utility.\nHopefully this isn\'t seen often, otherwise there is an issue with code reviews and/or testing.'
		);

		conn.on('close', () => {
			connectedUsers.delete(connId);
		});

		conn.on('message', (message) => {
			message = JSON.parse(message);
			switch(message.type) {
				case 'exit':
					wsProtocol.exit(connection);
					break;
				case 'help':
					wsProtocol.help(connection, message, config);
					break;
				case 'auth':
					wsProtocol.auth(connection, message, config);
					break;
				case 'showerror':
					wsProtocol.servererror(connection, message, config);
					break;
				case 'ping':
					wsProtocol.ping(connection);
					break;
				case 'git':
					switch(message.request.split()[0]) {
						case 'pull':
							wsProtocol.gitPull(connection, message, config);
							break;
						case 'rebase':
							wsProtocol.gitRebase(connection, message, config);
							break;
						case 'version':
							wsProtocol.gitVersion(connection, message, config);
							break;
						default:
							message.request = 'git';
							wsProtocol.help(connection, message, config);
							break;
					}
					break;
				case 'version':
					wsProtocol.version(connection, message, config);
					break;
				case 'restart':
					server.close(1);
					process.exit();
					break;
			}
		});
	});

	console.log(`Utility listening on port ${config.port}`);
}

startIncheon();