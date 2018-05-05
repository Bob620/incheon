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
		if (message.request && helpInfo.has(message.request)) {
			conn.sendMessage('message',
				helpInfo.get(message.request).desc
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
	showError: async (conn, message, config) => {
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

		simpleGit().pull(err => {
			if (err)
				conn.sendMessage('message',
					'Unable to update repo due to a fatal error, please retry or take higher action (gitrebase may work)'
				);
			else
				conn.sendMessage('message',
					'Repo updated, please restart using `restart`'
				);
		});
	},
	gitRebase: async (conn, message, config) => {
		conn.sendMessage('message',
			'Rebasing repo...'
		);

		simpleGit().pull('origin', 'master', {'--rebase': 'true'}, err => {
			if (err)
				conn.sendMessage('message',
					'Unable to rebase repo due to a fatal error, please retry or take higher action'
				);
			else
				conn.sendMessage('message',
					'Repo rebased, please restart using `restart`'
				);
		});
	},
	gitVersion: async (conn, message, config) => {
		conn.sendMessage('gitversion', {

		});
	}
};