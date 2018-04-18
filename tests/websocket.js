const wsOptions = {
	port: '4040'
};

const uws = require('uws');

const logger = require('../services/logger'),
      {hm, s, set} = require('../services/datastore'),
      ws = require('../services/websockets'),
      log = logger.createLogger('Tester'),
      constants = require('../util/constants'),
      util = require('../util/util');

set('users:test:password', util.hash('test', 'test')).catch(() => {});
hm.set('users:test:settings', 'someSetting', 'someValue').catch(() => {});

s.add('users', 'test').catch(() => {});
s.add('users:test:perms:env', 'testid').catch(() => {});
s.add('users:test:perms:env:testid', 0).catch(() => {});
s.add('users:test:perms:general', 0).catch(() => {});
s.add('users:test:roles', 'testrole').catch(() => {});

s.add('roles', 'testrole').catch(() => {});
s.add('roles:testrole:env', 'testid1').catch(() => {});
s.add('roles:testrole:env:testid1', 0).catch(() => {});
s.add('roles:testrole:general', 0).catch(() => {});

s.add('environments', '123', 'testid', 'testid1').catch(() => {});

logger.on('message', (serviceName, message) => {
	console.log(`[${serviceName}] - ${message}`)
});

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
			if (!response.needs.includes('twoFactor'))
				if (response.success) {
					log(`${'PASS'.green} | Authenticate via ws`);
					socket.send(JSON.stringify({
						type: 'get',
						request: {
							settings: [],
							env: []
						}
					}));
				} else
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
			if (response.settings) {
				log(`${'PASS'.green} | Responded with settings`);
				if (response.settings.someSetting === 'someValue')
					log(`${'PASS'.green} | Settings contains correct values`);
				else
					log(`${'FAIL'.red} | Settings contains correct values`);
			} else
				log(`${'FAIL'.red} | Responded with settings`);

			if (response.env) {
				response.env = new Map(response.env);
				log(`${'PASS'.green} | Responded with environments`);
				if (response.env.has('testid') && response.env.has('testid1'))
					log(`${'PASS'.green} | Correct environments included`);
				else
					log(`${'FAIL'.red} | Correct environments included`);
			} else
				log(`${'FAIL'.red} | Responded with environments`);

			if (response.users)
				log(`${'PASS'.green} | Responded with Users`);
			else
				log(`${'FAIL'.red} | Responded with Users`);
			break;
		case 'error':
			log(response.code);
			log(response.message);
			break;
	}
});
