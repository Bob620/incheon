const uws = require('uws');

const uuid = require('../util/util'),
      Connection = require('./connection'),
      constants = require('../util/constants');

class websockets {
	constructor() {
		this.data = {
			port: 0,
			server: undefined,
			conns: new Map()
		}
	}

	getPort() {
		return this.data.port;
	}

	setPort(port) {
		this.data.port = port;
	}

	async restartOnPort(port) {
		this.setPort(port);

		await this.closeServer();
		this.startServer();
	}

	addConnUser(connId, connection) {
		this.data.conns.set(connId, connection);
	}

	removeConnUser(connId) {
		this.data.conns.delete(connId);
	}

	startServer() {
		if (this.data.server === undefined) {
			this.data.server = new uws.Server({port: this.getPort()});

			this.data.server.on('connection', conn => {
				const connId = uuid.generateV4();
				const connection = new Connection(conn, connId);

				this.addConnUser(connId, connection);

				conn.on('close', () => {
					connection.data.state = constants.connection.states.CLOSED;
					this.removeConnUser(connId);
				});
			});
		}
	}

	closeServer() {
		return new Promise((resolve) => {
			if (this.data.server === undefined)
				resolve();
			else
				this.data.server.close(() => {
					this.data.server = undefined;
					resolve();
				});
		});
	}

	async init({port}) {
		await this.restartOnPort(port);
	}
}

module.exports = new websockets();