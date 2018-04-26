const util = require('./util'),
      constants = require('./constants');

module.exports = {
	ping: async conn => {
		conn.send('pong');
	},
	auth: async (conn, message, config) => {
		if (conn.login(message.request, config)) {
			conn.sendMessage('auth', {
				success: true
			});
		} else {
			// Failed to login
			conn.sendMessage('error', {
				code: constants.websocket.errorCodes.LOGIN,
				message: constants.websocket.errorMessages.LOGIN
			});
			conn.close();
		}
	},
	servererror: async (conn, message, config) => {
		if (conn.isLoggedIn()) {
			conn.sendMessage('error', {
				err: config.error
			});
		} else {
			// Failed to login
			conn.sendMessage('error', {
				code: constants.websocket.errorCodes.NOTLOGGEDIN,
				message: constants.websocket.errorMessages.NOTLOGGEDIN
			});
			conn.close();
		}
	},
	version: async (conn, message, config) => {
		conn.sendJSON({
			type:'message',
			response: `Recovery Utility Version: ${config.version}\nIncheon Version: ${require('../../package.json').version}`
		});
	},
	gitPull: async (conn, message, config) => {
		conn.sendMessage('gitpull', {

		});
	},
	gitVersion: async (conn, message, config) => {
		conn.sendMessage('gitversion', {

		});
	}
};