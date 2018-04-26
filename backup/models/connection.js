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

	login({username, password}, {admin: {adminUsername, passHash: adminPassHash}}) {
		if (adminUsername === username && adminPassHash === util.hash(username, password)) {
			this.data.isLoggedIn = true;
			return true;
		}
		return false;
	}

	sendMessage(type, response) {
		this.send(JSON.stringify(util.createMessage(type, response)));
	}

	send(message) {
		this.data.conn.send(message);
	}

	close() {
		this.data.conn.close();
	}
}

module.exports = Connection;