const wsOptions = {
	port: '4040'
};

const uws = require('uws');
const nacl = require('tweetnacl');

const logger = require('../services/logger');
const {client, getAsync} = require('../services/datastore');
const ws = require('../services/websockets');
const log = logger.createLogger('Tester');

const constants = require('../util/constants');
const util = require('../util/util');

logger.on('message', (serviceName, message) => {
	console.log(`[${serviceName}] - ${message}`)
});

datastore.set();

ws.init(wsOptions);
const socket = new uws(`ws://localhost:${wsOptions.port}`);

socket.on('open', () => {
	log('Websocket connected');

	socket.send(JSON.stringify({
		type: 'auth',
		request: {
			username: 'test',
			password: 'test'
		}
	}));
});

socket.on('message', (message) => {
	const {type, response} = JSON.parse(message);
	switch(type) {
		case 'auth':
			if (!response.twoFactor)
				if (response.login)
					log(`${'PASS'.green} | Authenticate via ws`);
				else
					log(`${'FAIL'.red} | Authenticate via ws`);
			else
				// IMPLEMENT TWOFACTOR SEND MESSAGE HERE
				log(`${'FAIL'.red} | Authenticate via ws (PLEASE IMPLEMENT TWOFACTOR INTO TESTS)`);
			break;
		case 'twoFactor':
			if (response.code)
				log(`${'PASS'.green} | Authenticate via ws with TwoFactor`);
			else
				log(`${'FAIL'.red} | Authenticate via ws with TwoFactor`);
			break;
		case 'set':

			break;
		case 'get':
			break;
		case 'error':
			log(response.code);
			log(response.message);
			break;
	}
});
