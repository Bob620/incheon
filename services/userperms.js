const nacl = require('tweetnacl');

const {hm, s, h} = require('./datastore'),
      constants = require('../util/constants'),
      util = require('../util/util');

class UserPerms {
	constructor() {
		this.data = {
			users: new Map(),
			conns: new Map()
		}
	}

	init() {

	}

	addUser(username, perms) {

	}

	removeUser(userId) {

	}

	authConn(conn, userId) {

	}

	deauthConn(connId) {

	}

	loginUser(connId, username, password) {

	}

	twoFactorUser(connId, code) {

	}

	async getUser(userId) {
		return await db.find(constants.database.ACCOUNTS, {_id: userId}, 1)[0];
	}

	async verifyLogin(username, password) {
		const [user] = await db.find(constants.database.ACCOUNTS, {'username': username}, 1);
		if (user && user.password && user.password === util.Utf8ArrayToStr(nacl.hash(new Uint8Array(`${username}${password}`))))
			return {userId: user._id, twoFactor: false};
		return false;
	}
}

class User {
	constructor() {
		this.data = {
			username: "",
			connections: new Map(),
		}
	}
}

module.exports = new UserPerms();