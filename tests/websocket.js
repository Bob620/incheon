const wsOptions = {
	port: '4040'
};

const uws = require('uws');

const logger = require('../services/logger'),
      ws = require('../services/websockets'),
      log = logger.createLogger('Tester'),
      constants = require('../util/constants'),
      structures = require('../util/structures');

logger.on('message', (serviceName, message) => {
	console.log(`[${serviceName}] - ${message}`)
});

log('Starting ws Test');

structures.createEnv({
	id: 'testid'
}).then(async () => {
	await structures.createEnv({
    id: 'testid1'
	});

	await structures.createEnv({
		id: 'test123'
	});

	const testRole = await structures.createRole({
		name: 'testrole',
		perms: [
			0
		],
		envs: [
			{
				id: "testid1",
				perms: [
					0
				]
			}
		]
	});

	const testUser = await structures.createUser({
		username: 'test',
		password: 'test',
		needsTwoFactor: false,
		settings: {
			someSetting: 'someValue',
		},
		roles: [
			'testrole'
		],
		perms: [
			constants.perms.GETUSERS
		],
		envs: [
			{
				id: 'testid',
				perms: [
					0
				]
			}
		]
	});

	await ws.init(wsOptions);
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

	socket.on('message', async (message) => {
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
								env: [],
								users: []
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
					if (response.env.size === 2 && response.env.has('testid') && response.env.has('testid1') && !response.env.has('123'))
						log(`${'PASS'.green} | Correct environments included`);
					else
						log(`${'FAIL'.red} | Correct environments included`);
				} else
					log(`${'FAIL'.red} | Responded with environments`);

				if (response.users && response.users.length === 1 && response.users[0] === 'test')
					log(`${'PASS'.green} | Responded with Users`);
				else
					log(`${'FAIL'.red} | Responded with Users`);

				try {
					await structures.deleteEnv('testid');
					if (!await testUser.hasEnv('testid'))
						log(`${'PASS'.green} | Remove env from database`);
					else
						log(`${'FAIL'.red} | Remove env from database`);

					await structures.deleteEnv('testid1');
					if (!await testRole.hasEnv('testid1'))
						log(`${'PASS'.green} | Remove env from database`);
					else
						log(`${'FAIL'.red} | Remove env from database`);


					await structures.deleteEnv('test123');
					log(`${'PASS'.green} | Remove env from database`);

					await structures.deleteRole('testrole');
					if (!await testUser.hasRole('testrole'))
						log(`${'PASS'.green} | Remove role from database`);
					else
						log(`${'FAIL'.red} | Remove role from database`);

					await structures.deleteUser('test');
					log(`${'PASS'.green} | Remove user from database`);
				} catch(err) {
					console.log(err);
				}
				break;
			case 'error':
				log(response.code);
				log(response.message);
				break;
		}
	});
});
