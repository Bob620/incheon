const {s} = require('../services/datastore'),
	    constants = require('../util/constants'),
	    User = require('../models/user'),
	    Role = require('../models/role'),
	    Env = require('../models/env');

module.exports = {
	createUser: async ({username, password, settings={}, roles=[], perms=[], envs=[], needsTwoFactor=false}) => {
		if (!await s.ismember(constants.database.users.BASE, username)) {
			const user = new User(username);

			await user.addPerms(...perms);

			for (const env of envs)
				await user.addEnv(env.id, ...env.perms);

			await user.changePassword('', password);

			await user.setTwoFactor(needsTwoFactor);

			await user.changeToDefaultSettings(settings);

			await user.addRoles(...roles);

			await s.add(constants.database.users.BASE, username);

			return user;
		}
		throw new Error('User already exists');
	},
	createRole: async ({name:roleName, perms=[], envs=[]}) => {
		if (!await s.ismember(constants.database.roles.BASE, roleName)) {
			const role = new Role(roleName);

			await role.addPerms(...perms);

			for (const env of envs)
				await role.addEnv(env.id, ...env.perms);

			await s.add(constants.database.roles.BASE, roleName);

			return role;
		}
		throw new Error('Role already exists');
	},
	createEnv: async ({id, settings={}}) => {
		if (!await s.ismember(constants.database.env.BASE, id)) {
			const env = new Env(id);

			await env.changeToDefaultSettings(settings);

			await s.add(constants.database.env.BASE, id);

			return env;
		}
		throw new Error('Environment already exists');
	},
	deleteUser: async (username) => {
		if (await s.ismember(constants.database.users.BASE, username)) {
			const user = new User(username);

			return await user.delete();
		}
		throw new Error('User does not exist');
	},
	deleteRole: async (roleName) => {
		if (await s.ismember(constants.database.roles.BASE, roleName)) {
			const role = new Role(roleName);

			return await role.delete();
		}
		throw new Error('Role does not exist');
	},
	deleteEnv: async (envId) => {
		if (await s.ismember(constants.database.env.BASE, envId)) {
			const env = new Env(envId);

			return await env.delete();
		}
		throw new Error('Environment does not exist');
	}
};