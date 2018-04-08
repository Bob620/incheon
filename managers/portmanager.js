class PortManager {
	constructor() {
		this.data = {
			minPort: 0,
			maxPort: 0,
			nextPort: 0,
			usedPorts: []
		}
	}

	getUsedPorts() {
		return this.data.usedPorts;
	}

	getMinPort() {
		return this.data.minPort;
	}

	getMaxPort() {
		return this.data.maxPort
	}

	setMinPort(port) {
		this.data.minPort = port;
	}

	setMaxPort(port) {
		this.data.maxPort = port;
	}

	addUsedPort(...ports) {
		this.data.usedPorts = this.data.usedPorts.concat(ports);
	}

	getNextPort() {
		if ((this.getMaxPort() - this.getMinPort()) > this.getUsedPorts().length === 0) {
			while (!this.checkPort(this.data.nextPort)) {
				if (++this.data.nextPort > this.getMaxPort())
					this.data.nextPort = this.getMinPort();
			}
			return this.data.nextPort++;
		}
		throw new Error('Unable to get another port (Out of ports)');
	}

	checkPort(port) {
		const usedPorts = this.getUsedPorts();
		if (port >= this.getMinPort() && port <= this.getMaxPort()) {
			return !usedPorts.includes(port);
		}
		return false;
	}

	// User functions

	/**
	 * @param minPort Minimum port
	 * @param maxPort Maximum port
	 * @param usedPorts Blacklisted ports between min and max
	 */
	init({minPort, maxPort, usedPorts=[]}) {
		this.setMinPort(minPort);
		this.setMaxPort(maxPort);
		this.addUsedPort(usedPorts);
	}

	/**
	 * @param port
	 * @returns {Number|Boolean}
	 */
	assign(port) {
		if (port === undefined) {
			return this.getNextPort();
		} else {
			return this.checkPort(port) ? () => {this.addUsedPort(port); return port} : false;
		}
	}

	/**
	 * @param port Port number to remove
	 */
	unassign(port) {
		this.data.usedPorts.slice(this.data.usedPorts.indexOf(port)-1, 1);
	}
}

module.exports = new PortManager();