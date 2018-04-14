const options = {
	"url": "localhost:27017",
		"dbName": "test",
		"account": {
		"username": "accountUser",
			"password": "password"
	},
	"log": false
};

const logger = require('../services/logger');
const database = require('../managers/databasemanager');
const log = logger.createLogger('Tester');

logger.on('message', (serviceName, message) => {
	console.log(`[${serviceName}] - ${message}`)
});

database.init(options).then(async () => {
	// Insert One Item
	try {
		const result = await database.insert('test', [{"test": [1]}]);
		if (result.result.n === 1)
			log(`${'PASS'.green} | Insert one`);
		else
			log(`${'FAIL'.red} | Insert one`);
	} catch(err) {
		log('Failed to insert one item: ');
		log(err);
	}

	// Insert Many Items
	try {
		const result = await database.insert('test', [{"test": [2]}, {"test": [2]}, {"test": [3]}]);
		if (result.result.n === 3)
			log(`${'PASS'.green} | Insert many`);
		else
			log(`${'FAIL'.red}  | Insert many`);
	} catch(err) {
		log('Failed to insert many items: ');
		log(err);
	}

	// Find One Item
	try {
		const result = await database.find('test', {test: {$in: [2]}}, 1);
		if (result.length === 1)
			log(`${'PASS'.green} | Find one`);
		else
			log(`${'FAIL'.red}  | Find one`);
	} catch(err) {
		log('Failed to find an item: ');
		log(err);
	}

	// Find Many Items
	try {
		const result = await database.find('test', {test: {$in: [2]}}, 3);
		if (result.length === 2)
			log(`${'PASS'.green} | Find many`);
		else
			log(`${'FAIL'.red}  | Find many`);
	} catch(err) {
		log('Failed to find items: ');
		log(err);
	}

	// Delete One Item
	try {
		const result = await database.deleteOne('test', {test: {$in: [1]}});
		if (result.result.n === 1)
			log(`${'PASS'.green} | Delete one`);
		else
			log(`${'FAIL'.red}  | Delete one`);
	} catch(err) {
		log('Failed to delete an item: ');
		log(err);
	}

	// Delete Many Items
	try {
		const result = await database.deleteMany('test', {test: {$in: [1, 2, 3]}});
		if (result.result.n === 3)
			log(`${'PASS'.green} | Delete many`);
		else
			log(`${'FAIL'.red}  | Delete many`);
	} catch(err) {
		log('Failed to delete items: ');
		log(err);
	}
}).catch((err) => {
	log(err);
});

