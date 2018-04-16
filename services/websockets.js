const uws = require('uws');

const auth = require('./userperms'),
      constants = require('../util/constants'),
      uuid = require('../util/util'),
      Connection = require('./connection');

class websockets {
	constructor() {
		this.data = {
			port: 0,
			server: undefined,
			conns: new Map()
		}
	}

	getPort() {
		return this.data.port;
	}

	setPort(port) {
		this.data.port = port;
	}

	addConnUser(connId, userId) {
		this.data.connUsers.set(connId, userId);
	}

	removeConnUser(connId) {
		this.data.connUsers.delete(connId);
	}

	startServer() {
		this.data.server = new uws.Server({port: this.getPort()});

		this.data.server.on('connection', conn => {
			const connId = uuid.generateV4();
			const connection = new Connection(conn, connId);

			this.data.conns.set(connId, connection);

			let needTwoFactor = false;
			let loggedIn = false;

			conn.on('message', async (message) => {
				const {type, request} = JSON.parse(message);

				switch(type) {
					case 'auth':
						// Verification
						if (!(needTwoFactor || loggedIn) && request.username && request.password) {
							const {userId, twoFactor} = await auth.verifyLogin(request.username, request.password);
							if (!twoFactor) {
								// Login if possible, else send error
								if (userId) {
									this.addConnUser(connId, userId);
									loggedIn = true;

									conn.send(JSON.stringify({
										type: 'auth',
										response: {
											"login": true,
											"twoFactor": false
										}
									}));
									break;
								}
							} else {
								// Needs 2 factor to login
								needTwoFactor = true;

								conn.send(JSON.stringify({
									type: 'auth',
									response: {
										"login": false,
										"twoFactor": true
									}
								}));
								break;
							}
						}

						// Failed to login
						conn.send(errorMessage(constants.websocket.error.LOGIN));
						break;
					case 'twoFactor':
						if (needTwoFactor && !loggedIn) {
							// Implement two factor here
						}
						conn.send(errorMessage(constants.websocket.error.TWOFACTOR));
						break;
					case 'set':
						if (loggedIn) {

						}
						break;
					case 'get':
						if (loggedIn) {

						}
						break;
					case 'deauth':
						if (loggedIn) {

						}
						break;
				}
			});
		});
	}

	init({port}) {
		this.setPort(port);

		this.startServer();
	}
}

module.exports = new websockets();