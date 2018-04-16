const {h, s, get} = require('./datastore'),
      constants = require('../util/constants'),
      util = require('../util/util');

class Connection {
	constructor(conn, connId) {
		this.data = {
			conn,
			connId,
			username: '',
			userLocation: '',
			isLoggedIn: false,
			isAuthenticated: false,
			needsTwoFactor: false
		};

		conn.on('close', () => {
			this.data.username = '';
			this.data.userLocation = '';
			this.data.isLoggedIn = false;
			this.data.isAuthenticated = false;
		});

		conn.on('message', async (message) => {
			const {type, request} = JSON.parse(message);

			switch(type) {
				case 'auth':
					if (await this.login(request)) {
						this.data.isAuthenticated = true;
						if (await this.needsTwoFactor()) {
							this.sendJSON(util.createMessage('auth', {
								success: false,
								need: ['twoFactor']
							}));
						} else {
							this.data.isLoggedIn = true;
							this.sendJSON(util.createMessage('auth', {
								success: true,
								need: []
							}));
						}
					} else {
						// Failed to login
						this.sendJSON(util.createMessage('error', {
							code: constants.websocket.errorCodes.LOGIN,
							message: constants.websocket.errorMessages.LOGIN
						}));
						conn.close();
					}
					break;
				case 'twoFactor':
					if (!this.isLoggedIn() && this.isAuthenticated() && await this.needsTwoFactor()) {
						// Implement two factor here
						this.data.isLoggedIn = true;
						this.sendJSON(util.createMessage('auth', {
							success: true,
							need: []
						}));
					} else
						this.sendJSON(util.createMessage('error', {
							code: constants.websocket.errorCodes.TWOFACTOR,
							message: constants.websocket.errorMessages.TWOFACTOR
						}));
					break;
				case 'set':
					if (this.isLoggedIn()) {

					} else {
						this.sendJSON(util.createMessage('error', {
							code: constants.websocket.errorCodes.NOTLOGGEDIN,
							message: constants.websocket.errorMessages.NOTLOGGEDIN
						}));
						conn.close();
					}
					break;
				case 'get':
					if (this.isLoggedIn()) {
						let response = {};
						if (request.settings) {
							response.settings = await this.getSettings();
						}

						if (request.env) {
							response.env = await this.getEnv();
						}

						if (request.users && await this.hasPerms(constants.perms.GETUSERS)) {
							response.users = await this.getUsers();
						}
						this.sendJSON(util.createMessage('get', response));
					} else {
						this.sendJSON(util.createMessage('error', {
							code: constants.websocket.errorCodes.NOTLOGGEDIN,
							message: constants.websocket.errorMessages.NOTLOGGEDIN
						}));
						conn.close();
					}
					break;
				case 'deauth':
					if (this.isLoggedIn()) {
						let response = {};
						if (request.conn) {
							if (request.conn.includes('this'))
								conn.close();
						}

						if (request.users) {

						}

						this.sendJSON(util.createMessage('deauth', response));
					} else {
						this.sendJSON(util.createMessage('error', {
							code: constants.websocket.errorCodes.NOTLOGGEDIN,
							message: constants.websocket.errorMessages.NOTLOGGEDIN
						}));
						conn.close();
					}
					break;
			}
		});
	}

	async getPerms() {
		return await h.getall(`${this.data.userLocation}:${constants.database.USERPERMS}`);
	}

	async getSettings() {
		return await h.getall(`${this.data.userLocation}:${constants.database.USERSETTINGS}`);
	}

	async getEnv() {
		return {};
	}

	async getUsers() {
		return {};
	}

	getUsername() {
		return this.data.username;
	}

	isLoggedIn() {
		return this.data.isLoggedIn;
	}

	isAuthenticated() {
		return this.data.isAuthenticated;
	}

	async hasPerms(...perms) {
		const userPerms = await this.getPerms();
		perms.forEach((perm) => {
			if (!userPerms.includes(perm))
				return false;
		});
		return true;
	}

	async needsTwoFactor() {
		return this.data.needsTwoFactor;
	}

	async login({username, password}) {
		if (username && password && !username.includes(':')) {
			username = username.toLowerCase();

			if (await s.ismember(constants.database.USERS, username) && await get(`${constants.database.USERS}:${username}:${constants.database.USERPASS}`) === util.hash(password)) {
				this.data.username = username;
				this.data.userLocation = `${constants.database.USERS}:${username}`;
				this.data.isLoggedIn = true;
				return true;
			}
		}
		return false;
	}

	sendString(message) {
		this.data.conn.send(message);
	}

	sendJSON(message) {
		this.data.conn.send(JSON.stringify(message));
	}
}

module.exports = Connection;