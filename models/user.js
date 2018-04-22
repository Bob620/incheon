const {h, s, set, get, del, hm} = require('../services/datastore'),
      constants = require('../util/constants'),
      util = require('../util/util');

class User {
	constructor(username) {
		this.data = {
			username,
			location: `${constants.database.users.BASE}:${username}`
		}
	}

	async changePassword(currentPassword, password) {
		if (this.comparePassword(currentPassword))
			return await set(`${this.data.location}:${constants.database.users.PASSWORD}`, util.hash(this.data.username, password));
		return false;
	}

	async comparePassword(testPassword) {
		const password = await get(`${this.data.location}:${constants.database.users.PASSWORD}`);
		return password ? password === util.hash(this.data.username, testPassword) : true;
	}

	async addEnv(envId, ...perms) {
		if (!!await s.ismember(constants.database.env.BASE, envId)) {
			await s.add(`${this.data.location}:${constants.database.users.perms.ENV}`, envId);
			for (const perm of perms)
				await s.add(`${this.data.location}:${constants.database.users.perms.ENV}:${envId}`, perm);
		}
	}

	async addEnvPerms(envId, ...perms) {
		if (await this.hasEnv(envId)) {
			for (const perm of perms)
				await s.add(`${this.data.location}:${constants.database.users.perms.ENV}:${envId}`, perm);
			return true;
		}
		return false;
	}

	async addPerms(...perms) {
		for (const perm of perms)
			await s.add(`${this.data.location}:${constants.database.users.perms.GENERAL}`, perm);
	}

	async setTwoFactor(value) {
		await set(`${this.data.location}:${constants.database.users.TWOFACTOR}`, value ? constants.database.variables.TRUE : constants.database.variables.FALSE);
	}

	async changeSetting(settingName, settingValue) {
		await h.set(`${this.data.location}:${constants.database.users.SETTINGS}`, settingName, settingValue);
	}

	async changeToDefaultSettings(settings) {
		settings.active ? settings.active = settings.active : settings.active = constants.database.variables.TRUE;
		for (const settingName in settings)
			if (settings.hasOwnProperty(settingName))
				await this.changeSetting(settingName, settings[settingName]);
	}

	async getSetting(settingName) {
		return await hm.get(`${this.data.location}:${constants.database.users.SETTINGS}`, settingName);
	}

	async getSettings() {
		return await h.getall(`${this.data.location}:${constants.database.users.SETTINGS}`);
	}

	async addRoles(...roleNames) {
		for (const roleName of roleNames)
			if (!!await s.ismember(constants.database.roles.BASE, roleName))
				await s.add(`${this.data.location}:${constants.database.users.ROLES}`, roleName);
	}

	async removeEnv(...envIds) {
		for (const envId of envIds) {
			const perms = await s.members(`${this.data.location}:${constants.database.users.perms.ENV}:${envId}`);

			await s.rem(`${this.data.location}:${constants.database.users.perms.ENV}`, envId);
			for (const perm of perms)
				await s.rem(`${this.data.location}:${constants.database.users.perms.ENV}:${envId}`, perm);
		}
	}

	async removeEnvPerms(envId, ...perms) {
		if (await this.hasEnv(envId))
			for (const perm of perms)
				await s.rem(`${this.data.location}:${constants.database.users.perms.ENV}:${envId}`, perm);
		return true;
	}

	async removePerms(...perms) {
		for (const perm of perms)
			await s.rem(`${this.data.location}:${constants.database.users.perms.GENERAL}`, perm);
	}

	async removeRoles(...roles) {
		for (const role of roles)
			await s.rem(`${this.data.location}:${constants.database.users.ROLES}`, role);
	}

	async hasEnv(envId) {
		return !!await s.ismember(`${this.data.location}:${constants.database.users.perms.ENV}`, envId);
	}

	async hasEnvPerm(envId, perm) {
		return !!await s.ismember(`${this.data.location}:${constants.database.users.perms.ENV}:${envId}`, perm);
	}

	async hasRole(roleName) {
		return !!await s.ismember(`${this.data.location}:${constants.database.users.ROLES}`, roleName);
	}

	async hasPerm(perm) {
		return !!await s.ismember(`${this.data.location}:${constants.database.users.perms.GENERAL}`, perm);
	}

	async getPerms() {
		return await s.members(`${this.data.location}:${constants.database.users.perms.GENERAL}`);
	}

	async getUsername() {
		return this.data.username;
	}

	async getRoleName() {
		return await s.members(`${this.data.location}:${constants.database.users.ROLES}`);
	}

	async getRoles() {
		const Role = require('./role');

		const roleNames = await this.getRoleName();
		let roles = new Map();

		for (const roleName of roleNames)
			roles.set(roleName, new Role(roleName));

		return roles;
	}

	async getEnvIds() {
		return await s.members(`${this.data.location}:${constants.database.users.perms.ENV}`);
	}

	async getEnvs() {
		const Env = require('./env');

		const envIds = await this.getEnvIds();
		let envs = new Map();

		for (const envId of envIds)
			envs.set(envId, new Env(envId));

		return envs;
	}

	async getEnvPerms(envId) {
		return s.members(`${this.data.location}:${constants.database.users.perms.ENV}:${envId}`);
	}

	async needsTwoFactor() {
		return await get(`${this.data.location}:${constants.database.users.TWOFACTOR}`) === constants.database.variables.TRUE;
	}

	async delete() {
		await del(`${this.data.location}:${constants.database.users.PASSWORD}`);
		await del(`${this.data.location}:${constants.database.users.TWOFACTOR}`);
		await s.rem(constants.database.users.BASE, this.data.username);

		const roles = await s.members(`${this.data.location}:${constants.database.users.ROLES}`);
		await this.removeRoles(...roles);

		const envIds = await s.members(`${this.data.location}:${constants.database.users.perms.ENV}`);
		await this.removeEnv(...envIds);

		const perms = await s.members(`${this.data.location}:${constants.database.users.perms.GENERAL}`);
		await this.removePerms(...perms);

		const settings = Object.keys(await h.getall(`${this.data.location}:${constants.database.users.SETTINGS}`));
		await h.del(`${this.data.location}:${constants.database.users.SETTINGS}`, ...settings);

		return true;
	}
}

module.exports = User;