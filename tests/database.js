const options = {
	"url": "localhost:27017",
		"dbName": "test",
		"account": {
		"username": "accountUser",
			"password": "password"
	},
	"log": true
};

const logger = require('../services/logger');
const database = require('../managers/databasemanager');

logger.on('message', (serviceName, message) => {
	console.log(`[${serviceName}] - ${message}`)
});

database.init(options);
