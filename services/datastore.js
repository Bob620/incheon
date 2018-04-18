// CHANGE THIS BEFORE COMMIT
const client = require('redis').createClient({});

const {promisify} = require('util');

module.exports = {client,
	get: promisify(client.get).bind(client),
	set: promisify(client.set).bind(client),
	h: {
		getall: promisify(client.hgetall).bind(client)
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