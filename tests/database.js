const options = {
	"url": "192.168.1.23:27017",
		"dbName": "test",
		"account": {
		"username": "test",
			"password": "test"
	},
	"log": true
};

const logger = require('../services/logger');
const database = require('../managers/databasemanager');

logger.on('message', (serviceName, message) => {
	console.log(`[${serviceName}] - ${message}`)
});

database.init(options);