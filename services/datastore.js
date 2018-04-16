// CHANGE THIS BEFORE COMMIT
const client = require('redis').createClient({host: '192.168.1.12'});

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
		add: promisify(client.sadd).bind(client),
		ismember: promisify(client.sismember).bind(client)
	}
};