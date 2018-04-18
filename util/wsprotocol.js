const constants = require('../util/constants');

module.exports = {
	ping: connection => {
		connection.sendResponse('pong', {});
	},
	auth: async (connection, request) => {
		if (await connection.login(request)) {
			if (connection.needsTwoFactor()) {
				connection.sendResponse('auth', {
					success: false,
					needs: ['twoFactor']
				});
			} else {
				connection.sendResponse('auth', {
					success: true,
					needs: []
				});
			}
		} else {
			// Failed to login
			connection.sendResponse('error', {
				code: constants.websocket.errorCodes.LOGIN,
				message: constants.websocket.errorMessages.LOGIN
			});
			connection.close();
		}
	},
	twoFactor: async (connection, request) => {
		if (!connection.isLoggedIn()) {
			if (connection.needsTwoFactor()) {
				// Implement two factor here
				if (await connection.checkTwoFactor(request.code))
					connection.sendResponse('auth', {
						success: true,
						need: []
					});
				else
					connection.sendResponse('error', {
						code: constants.websocket.errorCodes.TWOFACTOR,
						message: constants.websocket.errorMessages.TWOFACTOR
					});
			} else
				connection.sendResponse('error', {
					code: constants.websocket.errorCodes.NOTLOGGEDIN,
					message: constants.websocket.errorMessages.NOTLOGGEDIN
				});
		} else
			connection.sendResponse('error', {
				code: constants.websocket.errorCodes.ALREADYLOGGEDIN,
				message: constants.websocket.errorMessages.ALREADYLOGGEDIN
			});
	},
	set: async (connection, request) => {
		if (connection.isLoggedIn()) {

		} else {
			connection.sendResponse('error', {
				code: constants.websocket.errorCodes.NOTLOGGEDIN,
				message: constants.websocket.errorMessages.NOTLOGGEDIN
			});
			connection.close();
		}
	},
	get: async (connection, request) => {
		if (connection.isLoggedIn()) {
			let response = {};
			if (request.roles) {
				response.roles = await connection.getRoles();
			}

			if (request.perms) {
				response.perms = await connection.getPerms();
			}

			if (request.settings) {
				response.settings = await connection.getSettings();
			}

			if (request.env) {
				response.env = await connection.getEnv();
			}

			if (request.users && await connection.hasPerms(constants.perms.GETUSERS)) {
				response.users = await connection.getUsers();
			}
			connection.sendResponse('get', response);
		} else {
			connection.sendResponse('error', {
				code: constants.websocket.errorCodes.NOTLOGGEDIN,
				message: constants.websocket.errorMessages.NOTLOGGEDIN
			});
			connection.close();
		}
	},
	deauth: async (connection, request) => {
		if (this.isLoggedIn()) {
			let response = {};
			if (request.conn) {
				if (request.conn.includes('this'))
					connection.close();
			}

			if (request.users) {

			}

			connection.sendResponse('deauth', response);
		} else {
			connection.sendResponse('error', {
				code: constants.websocket.errorCodes.NOTLOGGEDIN,
				message: constants.websocket.errorMessages.NOTLOGGEDIN
			});
			connection.close();
		}
	}
};