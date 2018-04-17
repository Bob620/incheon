const {h, s, get} = require('./datastore'),
      constants = require('../util/constants'),
      wsProtocol = require('../util/wsprotocol');
      util = require('../util/util');

class Connection {
	constructor(conn, connId) {
		this.data = {
			conn,
			connId,
			username: '',
			userLocation: '',
			state: constants.connection.states.NOTLOGGEDIN
		};

		conn.on('message', async (message) => {
			if (this.getState() !== constants.connection.states.CLOSED) {
				const {type, request} = JSON.parse(message);

				switch(type) {
					case 'auth':
						wsProtocol.auth(this, request);
						break;
					case 'twoFactor':
						wsProtocol.twoFactor(this, request);
						break;
					case 'set':
						wsProtocol.set(this, request);
						break;
					case 'get':
						wsProtocol.get(this, request);
						break;
					case 'deauth':
						wsProtocol.deauth(this, request);
						break;
				}
			} else {
				this.sendResponse('error', {
					code: constants.websocket.errorCodes.SERVERERROR,
					message: constants.websocket.errorMessages.SERVERERROR
				});
				this.close();
			}
		});
	}

	async getPerms() {
		return await h.getall(`${this.data.userLocation}:${constants.database.USERPERMS}`);
	}

	async getSettings() {
		return await h.getall(`${this.data.userLocation}:${constants.database.USERSETTINGS}`);
	}

	getState() {
		return this.data.state;
	}

	async getEnv() {
		return {};
	}

	async getUsers() {
		return await get(constants.database.USERS);
	}

	getUsername() {
		return this.data.username;
	}

	isLoggedIn() {
		return this.data.state === constants.connection.states.LOGGEDIN;
	}

	async hasPerms(...perms) {
		const userPerms = await this.getPerms();
		perms.forEach((perm) => {
			if (!userPerms.includes(perm))
				return false;
		});
		return true;
	}

	needsTwoFactor() {
		return this.data.state === constants.connection.states.NEEDSTWOFACTOR;
	}

	async login({username, password}) {
		if (username && password && !username.includes(':')) {
			username = username.toLowerCase();

			if (await s.ismember(constants.database.USERS, username) && await get(`${constants.database.USERS}:${username}:${constants.database.USERPASS}`) === util.hash(username, password)) {
				this.data.username = username;
				this.data.userLocation = `${constants.database.USERS}:${username}`;

				const settings = await this.getSettings();

				if (settings.needsTwoFactor)
					this.data.state = constants.connection.states.NEEDSTWOFACTOR;
				else
					this.data.state = constants.connection.states.LOGGEDIN;

				return true;
			}
		}
		return false;
	}

	async checkTwoFactor(code) {
		return true;
	}

	sendString(message) {
		this.data.conn.send(message);
	}

	sendJSON(message) {
		this.data.conn.send(JSON.stringify(message));
	}

	sendResponse(type, response) {
		this.sendJSON(util.createMessage(type, response));
	}

	close() {
		this.data.conn.close();
	}
}

module.exports = Connection;