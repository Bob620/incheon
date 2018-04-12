const MongoClient = require('mongodb').MongoClient;

class DatabaseManager {
	constructor() {
		this.data = {
			log: false,
			ready: false,
			url: '',
			dbName: '',
			account: {
				password: '',
				username: ''
			},
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
		this.data.log ? this.data.log(`Using database ${name}`) : {};
		this.data.dbName = name;
	}

	setAccountInfo({password, username}) {
		this.data.log ? this.data.log('Database credentials updated') : {};
		this.data.account.password = password;
		this.data.account.username = username;
	}

	setLocation(url) {
		this.data.log ? this.data.log('Changing database location...') : {};
		this.data.url = `mongodb://${url}`;
		try {
			this.data.connection.close();
		} catch(err) {}

		this.data.connection = new MongoClient(url, (err, client) => {
			if (err)
				throw new Error(err);

			this.data.log ? this.data.log(`Location changed to ${url}`) : {};

			this.data.database = client.db(this.getDBName());
		});
	}

	/**
	 * @param url {string}
	 * @param dbName {string}
	 * @param account {{username: string, password: string}}
	 * @param log {boolean}
	 */
	init({url, dbName, account, log=process.env.NODE_ENV !== 'production'}) {
		this.data.log = log ? require('../services/logger').createLogger('database') : false;
		this.setAccountInfo(account);
		this.setDBName(dbName);
		this.setLocation(url);
	}

	/**
	 * @param collectionName {String} Collection name in the database
	 * @param items {Object[]} One or more items to insert in the collection
	 * @returns {Promise}
	 */
	insert(collectionName, ...items) {
		if (this.isConnected() && collectionName && items.length > 0) {
			switch(items.length) {
				case 1:
					this.data.log ? this.data.log(`Inserting one item into ${collectionName}`) : {};
					return this.data.database.collection(collectionName).insertOne(items[0]);
				default:
					this.data.log ? this.data.log(`Inserting many items into ${collectionName}`) : {};
					return this.data.database.collection(collectionName).insertMany(items);
			}
		}
		this.data.log ? this.data.log('insert failed') : {};
		return Promise.reject(false);
	}

	/**
	 * @param collectionName {String} Collection name in the database
	 * @param query {Object} Query to use when searching the collection
	 * @returns {Promise}
	 */
	find(collectionName, query={}) {
		if (this.isConnected() && collectionName) {
			this.data.log ? this.data.log(`Searching in ${collectionName}`) : {};
			return this.data.database.collection(collectionName).find(query).toArray();
		}
		this.data.log ? this.data.log('find failed') : {};
		return Promise.reject(false);
	}

	/**
	 * @param collectionName
	 * @param match
	 * @param change
	 * @returns {Promise}
	 */
	updateOne(collectionName, match, change) {
		if (this.isConnected() && collectionName && match && change) {
			this.data.log ? this.data.log(`Updating one in ${collectionName}`) : {};
			return this.data.database.collection(collectionName).updateOne(match, change);
		}
		this.data.log ? this.data.log('updateOne failed') : {};
		return Promise.reject(false);
	}

	/**
	 * @param collectionName
	 * @param match
	 * @param change
	 * @returns {Promise}
	 */
	updateMany(collectionName, match, change) {
		if (this.isConnected() && collectionName && match && change) {
			this.data.log ? this.data.log(`Updating many in ${collectionName}`) : {};
			return this.data.database.collection(collectionName).updateMany(match, change);
		}
		this.data.log ? this.data.log('updateMany failed') : {};
		return Promise.reject(false);
	}

	/**
	 * @param collectionName
	 * @param match
	 * @param item
	 * @returns {Promise}
	 */
	replaceOne(collectionName, match, item) {
		if (this.isConnected() && collectionName && match && item) {
			this.data.log ? this.data.log(`Replacing one in ${collectionName}`) : {};
			return this.data.database.collection(collectionName).updateMany(match, item);
		}
		this.data.log ? this.data.log('replaceOne failed') : {};
		return Promise.reject(false);
	}

	/**
	 * @param collectionName
	 * @param match
	 * @returns {Promise}
	 */
	deleteOne(collectionName, match) {
		if (this.isConnected() && collectionName && match) {
			this.data.log ? this.data.log(`Deleting one in ${collectionName}`) : {};
			return this.data.database.collection(collectionName).deleteOne(match, item);
		}
		this.data.log ? this.data.log('deleteOne failed') : {};
		return Promise.reject(false);
	}

	/**
	 * @param collectionName
	 * @param match
	 * @returns {Promise}
	 */
	deleteMany(collectionName, match) {
		if (this.isConnected() && collectionName && match) {
			this.data.log ? this.data.log(`Deleting many in ${collectionName}`) : {};
			return this.data.database.collection(collectionName).deleteMany(match, item);
		}
		this.data.log ? this.data.log('deleteMany failed') : {};
		return Promise.reject(false);
	}
}

module.exports = new DatabaseManager();