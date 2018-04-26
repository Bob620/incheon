const {s} = require('./datastore'),
      constants = require('../util/constants'),
      wsProtocol = require('../util/wsprotocol'),
      User = require('../models/user'),
      Env = require('../models/env'),
      util = require('../util/util');

class Connection {
	constructor(conn, connId) {
		this.data = {
			conn,
			connId,
			user: new User(),
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
					case 'twofactor':
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
		return await this.data.user.getRoles();
	}

	async getRolePerms() {
		let rolePerms = new Map();
		const roles = await this.getRoles();

		for (const [,role] of roles) {
			let env = new Map();

			const envs = role.getEnvIds();
			for (const envId of envs)
				env.set({
					id: envId,
					perms: await role.getEnvPerms(envId)
				});

			const roleName = await role.getName();
			rolePerms.set(roleName, {
				id: roleName,
				user: await role.getPerms(),
				env
			});
		}

		return rolePerms;
	}

	async getUserPerms() {
		return await this.data.user.getPerms();
	}

	async getEnvPerms() {
		let envs = new Map();

		if (await this.data.user.hasPerm(constants.perms.FULLENVACCESS)) {
			const envIds = await s.members(constants.database.env.BASE);

			for (const envId of envIds) {
				envs.set(envId, {
					id: envId,
					perms: [constants.perms.FULLENVACCESS]
				});
			}
		} else {
			const envIds = await this.data.user.getEnvIds();
			const roles = await this.data.user.getRoles();

			for (const envId of envIds) {
				envs.set(envId, {
					id: envId,
					perms: await this.data.user.getEnvPerms(envId)
				});
			}

			for(const [,role] of roles) {
				const envIds = await role.getEnvIds();
				for(const envId of envIds) {
					if(!envs.has(envId))
						envs.set(envId, {
							id: envId,
							perms: await role.getEnvPerms(envId)
						});
				}
			}
		}

		return envs;
	}

	async getEnvIds() {
		if(await this.data.user.hasPerm(constants.perms.FULLENVACCESS)) {
			return await s.members(constants.database.env.BASE);
		} else {
			const envIds = await this.data.user.getEnvIds();
			const roles = await this.data.user.getRoles();

			for(const [,role] of roles) {
				for(const envId of await role.getEnvIds()) {
					if(!envIds.includes(envId))
						envIds.push(envId);
				}
			}

			return envIds;
		}
	}

	async getEnvs() {
		if(await this.data.user.hasPerm(constants.perms.FULLENVACCESS)) {
			const envIds = await s.members(constants.database.env.BASE);
			const envs = new Map();

			for (const envId of envIds)
				envs.set(envId, new Env(envId));

			return envs;
		} else {
			const envs = await this.data.user.getEnvs();
			const roles = await this.data.user.getRoles();

			for(const [,role] of roles) {
				for(const [,env] of await role.getEnvs()) {
					if(!envs.has(await env.getId()))
						envs.set(await env.getId(), env);
				}
			}

			return envs;
		}
	}

	async getPerms() {
		return {
			user: await this.getUserPerms(),
			env: await this.getEnvPerms()
		};
	}

	async getSettings() {
		return await this.data.user.getSettings();
	}

	async getEnv() {
		const envPerms = await this.getEnvPerms();
		const envs = await this.getEnvs();

		const userEnvs = new Map();

		for (const [,env] of envs) {
			const envId = await env.getId();
			userEnvs.set(envId, {
				id: envId,
				perms: envPerms.get(envId),
				settings: env.getSettings()
			});
		}

		return userEnvs;
	}

	getState() {
		return this.data.state;
	}

	async getUsers() {
		return await s.members(constants.database.users.BASE);
	}

	async getUsername() {
		return await this.data.user.getUsername();
	}

	isLoggedIn() {
		return this.data.state === constants.connection.states.LOGGEDIN;
	}

	async hasPerms(...perms) {
		const userPerms = await this.getUserPerms();
		for (const perm of perms) {
			if (!userPerms.includes(perm))
				return false;
		}
		return true;
	}

	needsTwoFactor() {
		return this.data.state === constants.connection.states.NEEDSTWOFACTOR;
	}

	async login({username, password}) {
		if (username && username.length > 2 && password && password.length > 2 && !username.includes(':')) {
			username = username.toLowerCase();

			if (await s.ismember(constants.database.users.BASE, username)) {
				const user = new User(username);
				this.data.user = user;

				if (await user.comparePassword(password)) {
					if (await user.needsTwoFactor())
						this.data.state = constants.connection.states.NEEDSTWOFACTOR;
					else
						this.data.state = constants.connection.states.LOGGEDIN;
				}

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