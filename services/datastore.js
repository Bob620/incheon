const EventEmitter = require('events'),
      {promisify} = require('util');

const Redis = require('redis');

const constants = require('../util/constants');

class Client extends EventEmitter {
	constructor() {
		super();

		this.data = {
			host: 'localhost',
			maxFails: 5,
			client: undefined
		}
	}

	setHost(host) {
		this.data.host = host;
	}

	getHost() {
		return this.data.host;
	}

	reconnect() {
		this.disconnect();

		this.data.client = Redis.createClient({
			host: this.data.host,
			retry_strategy: info => {
				if (info.attempt > this.data.maxFails) {

//					this.data.client.quit();

					this.emit(constants.database.errorCodes.ECONNREFUSED, info.error);
					return false;
				}
				return 1000;
			}
		});

		this.data.client.on('end', () => {

		});

		this.data.client.on('error', err => {
			console.log(this.data.client.unref());
			console.log(this.data.client.attempts);
			if (this.data.client.attempts === this.data.maxFails) {
//				this.data.client.quit();
				this.emit(constants.database.errorCodes.ECONNREFUSED, err);
			}
		});

		this.get = promisify(this.data.client.get).bind(this.data.client);
		this.set = promisify(this.data.client.set).bind(this.data.client);
		this.del = promisify(this.data.client.del).bind(this.data.client);
		this.h = {
			getall: promisify(this.data.client.hgetall).bind(this.data.client),
			set: promisify(this.data.client.hset).bind(this.data.client),
			del: promisify(this.data.client.hdel).bind(this.data.client)
		};
		this.hm = {
			set: promisify(this.data.client.hmset).bind(this.data.client),
			get: promisify(this.data.client.hmget).bind(this.data.client)
		};
		this.s = {
			members: promisify(this.data.client.smembers).bind(this.data.client),
			add: promisify(this.data.client.sadd).bind(this.data.client),
			rem: promisify(this.data.client.srem).bind(this.data.client),
			ismember: promisify(this.data.client.sismember).bind(this.data.client)
		};
	}

	disconnect() {
		if (this.data.client)
			console.log(this.data.client.quit());
	}
}

module.exports = new Client({host: '192.168.1.12'});