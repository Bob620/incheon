// CHANGE THIS BEFORE COMMIT
const client = require('redis').createClient({host: '192.168.1.10'});

const {promisify} = require('util');

module.exports = {client,
	get: promisify(client.get).bind(client),
	set: promisify(client.set).bind(client),
	del: promisify(client.del).bind(client),
	h: {
		getall: promisify(client.hgetall).bind(client),
		del: promisify(client.hdel).bind(client),
		set: promisify(client.hset).bind(client)
	},
	hm: {
		set: promisify(client.hmset).bind(client),
		get: promisify(client.hmget).bind(client)
	},
	s: {
		members: promisify(client.smembers).bind(client),
		add: promisify(client.sadd).bind(client),
		rem: promisify(client.srem).bind(client),
		ismember: promisify(client.sismember).bind(client)
	}
};