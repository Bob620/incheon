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
					case 'ping':
						wsProtocol.ping(this);
						break;
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

	async getRoles() {
		return await s.members(`${this.data.userLocation}:${constants.database.users.ROLES}`);
	}

	async getRolePerms() {
		let rolePerms = new Map();
		const roles = await this.getRoles();

		for (const roleName of roles) {
			let env = new Map();

			const envIds = await s.members(`${constants.database.roles.BASE}:${roleName}:${constants.database.roles.ENV}`);
			for (const envId of envIds) {
				env.set(envId, {
					id: envId,
					perms: await s.members(`${constants.database.roles.BASE}:${roleName}:${constants.database.roles.ENV}:${envId}`)
				});
			}

			rolePerms.set(roleName, {
				id: roleName,
				user: await s.members(`${constants.database.roles.BASE}:${roleName}:${constants.database.roles.GENERAL}`),
				env
			});
		}

		return rolePerms;
	}

	async getUserPerms() {
		return await s.members(`${this.data.userLocation}:${constants.database.users.perms.GENERAL}`);
	}

	async getEnvPerms() {
		let envs = new Map();
		const userPerms = await this.getUserPerms();

		if (userPerms.includes(constants.perms.FULLENVACCESS)) {
			const envIds = await s.members(constants.database.env.BASE);
			for (const envId of envIds) {
				envs.set(envId, {
					id: envId,
					perms: [constants.perms.FULLENVACCESS]
				});
			}
		} else {
			const envIds = await s.members(`${this.data.userLocation}:${constants.database.users.perms.ENV}`);
			const rolePerms = await this.getRolePerms();

			for (const envId of envIds) {
				envs.set(envId, {
					id: envId,
					perms: await s.members(`${this.data.userLocation}:${constants.database.users.perms.ENV}:${envId}`)
				});
			}

			for(const [roleId, role] of rolePerms) {
				for(const [envId, env] of role.env) {
					if(!envs.has(envId))
						envs.set(envId, env);
				}
			}
		}

		return envs;
	}

	async getEnvIds() {
		const userPerms = await this.getUserPerms();

		if(userPerms.includes(constants.perms.FULLENVACCESS)) {
			return await s.members(constants.database.env.BASE);
		} else {
			const envIds = await s.members(`${constants.database.users.perms.ENV}`);
			const rolePerms = await this.getRolePerms();

			for(const [roleId, role] of rolePerms) {
				for(const [envId] of role.env) {
					if(!envIds.includes(envId))
						envIds.push(envId);
				}
			}

			return envIds;
		}
	}

	async getEnvSettings() {
		const envIds = await this.getEnvIds();
		let env = new Map();

		for (const envId of envIds) {
			env.set(envId, {
				id: envId,
				settings: await h.getall(`${constants.database.env.BASE}:${envId}:${constants.database.env.SETTINGS}`)
			});
		}

		return env;
	}

	async getPerms() {
		return {
			user: this.getUserPerms(),
			env: this.getEnvPerms()
		};
	}

	async getSettings() {
		return await h.getall(`${this.data.userLocation}:${constants.database.users.SETTINGS}`);
	}

	async getEnv() {
		const envPerms = await this.getEnvPerms();
		const envSettings = await this.getEnvSettings();
		let envs = new Map();

		for (const [envId, envPerm] of envPerms) {
			envs.set(envId, {
				id: envId,
				perms: envPerm,
				settings: envSettings.get(envId)
			});
		}

		return envs;

/*
		constants.database.users.BASE:username:constants.database.users.perms.ENV
		constants.database.users.BASE:username:constants.database.users.perms.GENERAL
		constants.database.users.BASE:username:constants.database.users.ROLES

		constants.database.roles.BASE:roleName:constants.database.roles.ENV
		constants.database.roles.BASE:roleName:constants.database.roles.GENERAL

		users:username:perms:env [envId]
		users:username:perms:env:envId []
		users:username:perms:general []

		roles:roleName:env [envId]
		roles:roleName:env:envId []
		roles:roleName:general []
*/
	}

	getState() {
		return this.data.state;
	}

	async getUsers() {
		return await get(constants.database.users.BASE);
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

			if (await s.ismember(constants.database.users.BASE, username) && await get(`${constants.database.users.BASE}:${username}:${constants.database.users.PASSWORD}`) === util.hash(username, password)) {
				this.data.username = username;
				this.data.userLocation = `${constants.database.users.BASE}:${username}`;

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