const {h, s, hm} = require('../services/datastore'),
      constants = require('../util/constants');

class Env {
	constructor(envId) {
		this.data = {
			envId,
			location: `${constants.database.env.BASE}:${envId}`
		}
	}

	async changeSetting(settingName, settingValue) {
		await h.set(`${this.data.location}:${constants.database.env.SETTINGS}`, settingName, settingValue);
	}

	async changeToDefaultSettings(settings={}) {
		settings.active ? settings.active = settings.active : settings.active = constants.database.variables.TRUE;
		for (const settingName in settings)
			if (settings.hasOwnProperty(settingName))
				await this.changeSetting(settingName, settings[settingName]);
	}

	async getSetting(settingName) {
		return await hm.get(`${this.data.location}:${constants.database.env.SETTINGS}`, settingName);
	}

	async getSettings() {
		return await h.getall(`${this.data.location}:${constants.database.env.SETTINGS}`);
	}

	async getId() {
		return this.data.envId;
	}

	async delete() {
		const Role = require('./role');
		const User = require('./user');

		await s.rem(constants.database.env.BASE, this.data.envId);

		const settings = Object.keys(await h.getall(`${this.data.location}:${constants.database.env.SETTINGS}`));
		await h.del(`${this.data.location}:${constants.database.env.SETTINGS}`, ...settings);

		const roles = await s.members(constants.database.roles.BASE);
		for (const roleName of roles) {
			const role = new Role(roleName);
			await role.removeEnv(this.data.envId);
		}

		const users = await s.members(constants.database.users.BASE);
		for (const username of users) {
			const user = new User(username);
			await user.removeEnv(this.data.envId);
		}

		return true;
	}
}

module.exports = Env;