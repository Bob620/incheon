const {hm, h, s, set, del} = require('../services/datastore'),
	    constants = require('../util/constants'),
      util = require('../util/util');

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

module.exports = {
	createUser: async ({username, password, settings={}, roles=[], perms={general: [], env: []}}) => {
		const userLocation = `${constants.database.users.BASE}:${username}`;

		await set(`${userLocation}:${constants.database.users.PASSWORD}`, util.hash(username, password));

		await s.add(constants.database.users.BASE, username);

		for (const perm of perms.general)
			await s.add(`${userLocation}:${constants.database.users.perms.GENERAL}`, perm);

		for (const env of perms.env) {
			await s.add(`${userLocation}:${constants.database.users.perms.ENV}`, env.id);
			for (const perm of env.perms)
				await s.add(`${userLocation}:${constants.database.users.perms.ENV}:${env.id}`, perm);
		}

		for (const settingName in settings)
			await hm.set(`${userLocation}:${constants.database.users.SETTINGS}`, settingName, settings[settingName]);

		for (const roleName of roles)
			await s.add(`${userLocation}:${constants.database.users.ROLES}`, roleName);
	},
	createRole: async ({name:roleName, perms=[], envs=[]}) => {
		const roleLocation = `${constants.database.roles.BASE}:${roleName}`;

		await s.add(constants.database.roles.BASE, roleName);

		for (const perm of perms)
			await s.add(`${roleLocation}:${constants.database.roles.GENERAL}`, perm);

		for (const env of envs) {
			await s.add(`${roleLocation}:${constants.database.roles.ENV}`, env.id);
			for (const perm of env.perms)
				await s.add(`${roleLocation}:${constants.database.roles.ENV}:${env.id}`, perm);
		}
	},
	createEnv: async (envId) => {

		s.add('environments', '123', 'testid', 'testid1').catch(() => {});

	},
	deleteUser: async (username) => {
		const userLocation = `${constants.database.users.BASE}:${username}`;

		await del(`${userLocation}:${constants.database.users.PASSWORD}`);

		await s.rem(constants.database.users.BASE, username);

		const generalPerms = await s.members(`${userLocation}:${constants.database.users.perms.GENERAL}`);
		for (const perm of generalPerms)
			await s.rem(`${userLocation}:${constants.database.users.perms.GENERAL}`, perm);

		const envIds = await s.members(`${userLocation}:${constants.database.users.perms.ENV}`);
		for (const envId of envIds) {
			const envPerms = await s.members(`${userLocation}:${constants.database.users.perms.ENV}:${envId}`);
			await s.rem(`${userLocation}:${constants.database.users.perms.ENV}`, envId);
			for (const perm of envPerms)
				await s.rem(`${userLocation}:${constants.database.users.perms.ENV}:${envId}`, perm);
		}

		const settings = await h.getall(`${userLocation}:${constants.database.users.SETTINGS}`);
		for (const settingName in settings)
			await h.del(`${userLocation}:${constants.database.users.SETTINGS}`, settingName);

		const roles = await s.members(`${userLocation}:${constants.database.users.ROLES}`);
		for (const roleName of roles)
			await s.rem(`${userLocation}:${constants.database.users.ROLES}`, roleName);
	},
	deleteRole: async (roleName) => {
		const roleLocation = `${constants.database.roles.BASE}:${roleName}`;

		await s.rem(constants.database.roles.BASE, roleName);

		const perms = await s.members(`${roleLocation}:${constants.database.roles.GENERAL}`);
		for (const perm of perms)
			await s.rem(`${roleLocation}:${constants.database.roles.GENERAL}`, perm);

		const envIds = await s.members(`${roleLocation}:${constants.database.roles.ENV}`);
		for (const envId of envIds) {
			const envPerms = await s.members(`${roleLocation}:${constants.database.roles.ENV}:${envId}`);
			await s.rem(`${roleLocation}:${constants.database.roles.ENV}`, envId);
			for (const perm of envPerms)
				await s.rem(`${roleLocation}:${constants.database.roles.ENV}:${envId}`, perm);
		}
	},
	deleteEnv: (envId) => {

	},
	addUserRole: (username, roleName) => {
		s.add(`${constants.database.users.BASE}:${username}:${constants.database.users.ROLES}`, roleName).catch(() => {});
	},
	addUserEnv: (username, envId, perms) => {
		s.add(`${constants.database.users.BASE}:${username}:${constants.database.users.perms.ENV}`, envId).catch(() => {});

		for (const perm of perms)
			s.add(`${constants.database.users.BASE}:${username}:${constants.database.users.perms.ENV}:${envId}`, perm).catch(() => {});
	},
	addUserPerm: (username, type, perms=[]) => {
		for (const perm of perms)
			s.add(`${constants.database.users.BASE}:${username}:${type}`, perm).catch(() => {});
	},
	addRoleEnv: (roleName, envId, perms) => {
		s.add(`${constants.database.roles.BASE}:${roleName}:${constants.database.roles.ENV}`, envId).catch(() => {});

		for (const perm of perms)
			s.add(`${constants.database.roles.BASE}:${roleName}:${constants.database.roles.GENERAL}:${envId}`, perm).catch(() => {});
	},
	addRolePerm: (roleName, type, perms) => {
		for (const perm of perms)
			s.add(`${constants.database.roles.BASE}:${roleName}:${type}`, perm).catch(() => {});
	}
}