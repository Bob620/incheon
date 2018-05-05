const simpleGit = require('simple-git');

const util = require('./util'),
      helpInfo = new Map(require('./help').commands);
      constants = require('./constants');

module.exports = {
	ping: async conn => {
		conn.sendMessage('pong', {});
	},
	exit: async conn => {
		conn.close();
	},
	help: async (conn, message, config) => {
		if (helpInfo.has(message)) {
			conn.sendMessage('message',
				helpInfo.get(message).desc
			);
		} else {
			let helpMessage = '';
			for(const [commandName, command] of helpInfo) {
				helpMessage += `\n${commandName} - ${command.desc}`;
			}

			conn.sendMessage('message',
				helpMessage
			);
		}
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
		conn.sendMessage('message',
			'Pulling repo updates...'
		);

		try {
			simpleGit().pull(() => {
				conn.sendMessage('message',
					'Repo updated, please restart using `restart`'
				);
			});
		} catch(err) {
			console.log(err);

			conn.sendMessage('message',
				'Unable to rebase repo due to error, please retry or take higher action'
			);
		}
	},
	gitVersion: async (conn, message, config) => {
		conn.sendMessage('gitversion', {

		});
	}
};