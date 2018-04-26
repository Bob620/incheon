class Incheon {
	constructor() {
		this.data = {

		}
	}

	init(config) {

	}

	start({backupTest=false}) {
		if (backupTest) {
			// Test the backup service
			throw "intentional uncaught error";
		} else {
			require('./tests/websocket');
		}
	}
}

module.exports = new Incheon();