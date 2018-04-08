const MongoClient = require('mongodb').MongoClient;

class DatabaseManager {
	constructor() {
		this.data = {
			ready: false,
			url: '',
			account: {password: '', username: ''},
			connection: undefined
		}
	}

	isConnected() {
		if (this.data.connection)
			return this.data.connection.isConnected;
		else
			return false;
	}

	setLocation(url) {
		this.data.url = `mongodb://${url}`;
		try {
			this.data.connection.close();
		} catch(err) {}

		this.data.connection = new MongoClient(url, (err, client) => {
			if (err)
				throw new Error(err);
		});
	}

	init({url, user: {password, username}}) {
		this.data.account.password = password;
		this.data.account.username = username;

		this.setLocation(url);
	}

	put(collectionName, item) {
		if (this.isConnected()) {

		}
		return false;
	}

	get(collectionName, ) {
		if (this.isConnected()) {

		}
		return false;
	}
}

module.exports = new DatabaseManager();