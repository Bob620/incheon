const logger = require('../services/logger'),
      {h, hm, s} = require('../services/datastore'),
      log = logger.createLogger('Tester'),
      constants = require('../util/constants');

logger.on('message', (serviceName, message) => {
	console.log(`[${serviceName}] - ${message}`)
});

hm.set(`${constants.database.USERSETTINGS}:bob620`, 'test', 'Keepo').then(async () => {
	await s.add(constants.database.USERS, 'bob620');
	log(await s.ismember(constants.database.USERS, 'bob620'));

	log(await hm.get(`${constants.database.USERSETTINGS}:bob620`, 'test'));
	console.log(await h.getall(`${constants.database.USERSETTINGS}:bob620`));
});

/*
database.init(options).then(async () => {
	log(`${'PASS'.green} | Connect to database`);

	// Insert One
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

	// Insert Many
	try {
		const result = await database.insert('test', [{"test": [2]}, {"test": [2]}, {"test": [3]}]);
		if (result.result.n === 3)
			log(`${'PASS'.green} | Insert many`);
		else
			log(`${'FAIL'.red} | Insert many`);
	} catch(err) {
		log('Failed to insert many items: ');
		log(err);
	}

	// Find One
	try {
		const result = await database.find('test', {test: {$in: [2]}}, 1);
		if (result.length === 1)
			log(`${'PASS'.green} | Find one`);
		else
			log(`${'FAIL'.red} | Find one`);
	} catch(err) {
		log('Failed to find an item: ');
		log(err);
	}

	// Find Many
	try {
		const result = await database.find('test', {test: {$in: [2]}}, 3);
		if (result.length === 2)
			log(`${'PASS'.green} | Find many`);
		else
			log(`${'FAIL'.red} | Find many`);
	} catch(err) {
		log('Failed to find items: ');
		log(err);
	}

	// Update One
	try {
//		const result = await database.deleteOne('test', {test: {$in: [1]}});
//		if (result.result.n === 1)
//			log(`${'PASS'.green} | Delete one`);
//		else
			log(`${'UPDT'.red} | Update one`);
	} catch(err) {
		log('Failed to update an item: ');
		log(err);
	}

	// Update Many
	try {
//		const result = await database.deleteOne('test', {test: {$in: [1]}});
//		if (result.result.n === 1)
//			log(`${'PASS'.green} | Delete one`);
//		else
			log(`${'UPDT'.red} | Update many`);
	} catch(err) {
		log('Failed to update items: ');
		log(err);
	}

	// Replace One
	try {
//		const result = await database.deleteOne('test', {test: {$in: [1]}});
//		if (result.result.n === 1)
//			log(`${'PASS'.green} | Delete one`);
//		else
			log(`${'UPDT'.red} | Replace one`);
	} catch(err) {
		log('Failed to replace an item: ');
		log(err);
	}

	// Delete One
	try {
		const result = await database.deleteOne('test', {test: {$in: [1]}});
		if (result.result.n === 1)
			log(`${'PASS'.green} | Delete one`);
		else
			log(`${'FAIL'.red} | Delete one`);
	} catch(err) {
		log('Failed to delete an item: ');
		log(err);
	}

	// Delete Many
	try {
		const result = await database.deleteMany('test', {test: {$in: [1, 2, 3]}});
		if (result.result.n === 3)
			log(`${'PASS'.green} | Delete many`);
		else
			log(`${'FAIL'.red} | Delete many`);
	} catch(err) {
		log('Failed to delete items: ');
		log(err);
	}
}).catch((err) => {
	log(`${'FAIL'.red}  | Connect to database`);
	log(err);
});
*/