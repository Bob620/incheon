const util = require('../util/util');

class Connection {
	constructor(connId, conn) {
		this.data = {
			connId,
			conn,
			isLoggedIn: false
		}
	}

	isLoggedIn() {
		return this.data.isLoggedIn;
	}

	login({username, password}, {admin: {username: adminUsername, password: adminPassword}}) {
		if (adminUsername === username && util.hash(adminUsername, adminPassword) === util.hash(username, password)) {
			this.data.isLoggedIn = true;
			return true;
		}
		return false;
	}

	sendMessage(type, response) {
		this.sendJSON(util.createMessage(type, response));
	}

	sendJSON(message) {
		this.send(JSON.stringify(message));
	}

	send(message) {
		this.data.conn.send(message);
	}

	close() {
		this.data.conn.close();
	}
}

module.exports = Connection;