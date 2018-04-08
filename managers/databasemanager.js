const MongoClient = require('mongodb').MongoClient;

class DatabaseManager {
	constructor() {
		this.data = {
			ready: false,
			url: '',
			dbName: '',
			account: {password: '', username: ''},
			connection: undefined,
			database: undefined
		}
	}

	getDBName() {
		return this.data.dbName;
	}

	isConnected() {
		if (this.data.connection)
			return this.data.connection.isConnected;
		else
			return false;
	}

	setDBName(name) {
		this.data.dbName = name;
	}

	setAccountInfo({password, username}) {
		this.data.account.password = password;
		this.data.account.username = username;
	}

	setLocation(url) {
		this.data.url = `mongodb://${url}`;
		try {
			this.data.connection.close();
		} catch(err) {}

		this.data.connection = new MongoClient(url, (err, client) => {
			if (err)
				throw new Error(err);

			this.data.database = client.db(this.getDBName());
		});
	}

	/**
	 * @param url {String}
	 * @param dbName {String}
	 * @param user {Object}
	 */
	init({url, dbName, user}) {
		this.setAccountInfo(user);
		this.setDBName(dbName);
		this.setLocation(url);
	}

	/**
	 * @param collectionName {String} Collection name in the database
	 * @param items {Object[]} One or more items to insert in the collection
	 * @returns {Promise}
	 */
	insert(collectionName, ...items) {
		if (this.isConnected() && items.length > 0) {
			switch(items.length) {
				case 1:
					return this.data.database.collection(collectionName).insertOne(items[0]);
				default:
					return this.data.database.collection(collectionName).insertMany(items);
			}
		}
		return Promise.reject(false);
	}

	/**
	 * @param collectionName {String} Collection name in the database
	 * @param query {Object} Query to use when searching the collection
	 * @returns {Promise}
	 */
	find(collectionName, query={}) {
		if (this.isConnected()) {
			return this.data.database.collection(collectionName).find(query).toArray();
		}
		return Promise.reject(false);
	}
}

module.exports = new DatabaseManager();