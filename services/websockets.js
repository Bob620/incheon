const uws = require('uws');

const auth = require('./userperms'),
      constants = require('../util/constants'),
      uuid = require('../util/util'),
      Connection = require('./connection');

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

	addConnUser(connId, connection) {
		this.data.conns.set(connId, connection);
	}

	removeConnUser(connId) {
		this.data.conns.delete(connId);
	}

	startServer() {
		this.data.server = new uws.Server({port: this.getPort()});

		this.data.server.on('connection', conn => {
			const connId = uuid.generateV4();
			const connection = new Connection(conn, connId);

			this.addConnUser(connId, connection);

			conn.on('close', () => {
				this.removeConnUser(connId);
			});
		});
	}

	init({port}) {
		this.setPort(port);

		this.startServer();
	}
}

module.exports = new websockets();