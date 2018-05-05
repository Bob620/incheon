class Incheon {
	constructor() {
		this.data = {

		}
	}

	init(config) {

	}

	start({forceError=false}) {
		if (forceError) {
			// Test the backup service
			throw "intentional uncaught error";
		} else {
			require('./tests/websocket');
		}
	}
}

module.exports = new Incheon();