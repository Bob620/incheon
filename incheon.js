const EventEmitter = require('events');

const redisClient = require('./services/datastore'),
      constants = require('./util/constants');

class Incheon extends EventEmitter {
	constructor() {
		super();

		this.data = {

		}
	}

	init(config) {
		redisClient.on(constants.database.errorCodes.ECONNREFUSED, err => {
			this.emit('fail', err);
		});

		redisClient.setHost(config.redis.host);
		redisClient.reconnect();
	}

	start({forceError=false}) {
		if (forceError) {
			// Test the backup service
			throw "intentional uncaught error";
		} else {
			require('./tests/websocket');
		}
	}

	cleanup() {
		redisClient.disconnect();
	}
}

module.exports = new Incheon();