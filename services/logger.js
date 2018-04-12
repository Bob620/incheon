const EventEmitter = require('events');

const colors = require('colors');

class Logger extends EventEmitter {
	constructor() {
		super();

		this.data = {
			services: new Map()
		}
	}

	getLogs(serviceName, max=1) {
		try {
			const service = this.data.services.get(serviceName);
			return service.slice(service.length() - max, service.length());
		} catch(err) {return []}
	}

	log(serviceName, message) {
		const service = this.data.services.get(serviceName);

		if (service !== undefined)
			service.push(message);
		else
			this.data.services.set(serviceName, [message]);
		this.emit(serviceName, message);
	}

	createLogger(service) {
		return this.log.bind(this, service);
	}
}

module.exports = new Logger();