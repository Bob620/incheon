const {s} = require('../services/datastore'),
      constants = require('../util/constants');

class Role {
	constructor(roleName) {
		this.data = {
			roleName,
			location: `${constants.database.roles.BASE}:${roleName}`
		}
	}

	async addPerms(...perms) {
		for (const perm of perms)
			await s.add(`${this.data.location}:${constants.database.roles.GENERAL}`, perm);
	}

	async addEnv(envId, ...perms) {
		if (!!await s.ismember(constants.database.env.BASE, envId)) {
			await s.add(`${this.data.location}:${constants.database.roles.ENV}`, envId);
			for (const perm of perms)
				await s.add(`${this.data.location}:${constants.database.roles.ENV}:${envId}`, perm);
		}
	}

	async addEnvPerms(envId, ...perms) {
		if (await this.hasEnv(envId)) {
			for (const perm of perms)
				await s.add(`${this.data.location}:${constants.database.roles.ENV}:${envId}`, perm);
		}
	}

	async removeEnv(...envIds) {
		for (const envId of envIds) {
			const perms = await s.members(`${this.data.location}:${constants.database.roles.ENV}:${envId}`);

			await s.rem(`${this.data.location}:${constants.database.roles.ENV}`, envId);
			for (const perm of perms)
				await s.rem(`${this.data.location}:${constants.database.roles.ENV}:${envId}`, perm);
		}
	}

	async removeEnvPerms(envId, ...perms) {
		if (await this.hasEnv(envId))
			for (const perm of perms)
				await s.rem(`${this.data.location}:${constants.database.roles.ENV}:${envId}`, perm);
		return true;
	}

	async removePerms(...perms) {
		for (const perm of perms)
			await s.rem(`${this.data.location}:${constants.database.roles.GENERAL}`, perm);
	}

	async hasEnv(envId) {
		return !!await s.ismember(`${this.data.location}:${constants.database.roles.ENV}`, envId);
	}

	async hasEnvPerm(envId, perm) {
		return !!await s.ismember(`${this.data.location}:${constants.database.roles.ENV}:${envId}`, perm);
	}

	async hasPerm(perm) {
		return !!await s.ismember(`${this.data.location}:${constants.database.roles.GENERAL}`);
	}

	async getPerms() {
		return s.members(`${this.data.location}:${constants.database.roles.GENERAL}`);
	}

	async getEnvIds() {
		return await s.members(`${this.data.location}:${constants.database.roles.ENV}`);
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
		return s.members(`${this.data.location}:${constants.database.roles.ENV}:${envId}`);
	}

	async getName() {
		return this.data.roleName;
	}

	async delete() {
		const User = require('./user');

		await s.rem(constants.database.roles.BASE, this.data.roleName);

		const perms = await s.members(`${this.data.location}:${constants.database.roles.GENERAL}`);
		await this.removePerms(...perms);

		const envIds = await s.members(`${this.data.location}:${constants.database.roles.ENV}`);
		await this.removeEnv(...envIds);

		const users = await s.members(constants.database.users.BASE);
		for (const username of users) {
			const user = new User(username);
			await user.removeRoles(this.data.roleName);
		}

		return true;
	}
}

module.exports = Role;