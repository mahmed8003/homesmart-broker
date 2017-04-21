'use strict';

const Bluebird = require('bluebird');
const MongoClient = require('mongodb').MongoClient;


/**
 *
 */
class MongoDatabase {

	/**
	 *
	 */
	constructor(options, logger) {
		this._logger = logger;
		this._uri = options.uri;
		this._db = null;

		this._userCollection = null;
		this._userCommandsCollection = null;
		this._deviceResponsesCollection = null;
	}


	connect() {
		const self = this;
		const options = {
			promiseLibrary: Bluebird
		};
		MongoClient.connect(this._uri, options, function (err, db) {
			if (err) {
				self._logger.error(err);
			} else {
				self._logger.info('Connection with database succeeded');
				self._db = db;

				db.collection('users', {strict : true}, function (err, collection) {
					if (err) {
						self._logger.error(err);
					}else{
						self._userCollection = collection;
					}

				});

				db.collection('user_commands', {strict : true}, function (err, collection) {
					if (err) {
						self._logger.error(err);
					}else{
						self._userCommandsCollection = collection;
					}

				});

				db.collection('device_responses', {strict : true}, function (err, collection) {
					if (err) {
						self._logger.error(err);
					}else{
						self._deviceResponsesCollection = collection;
					}

				});
			}
		});
	}


	/**
	 * close client connection
	 */
	close() {
		const self = this;
		if (this._db != null) {
			this._db.close(function (err) {
				if(err) {
					self._logger.error(err);
				}
			});
			this._db = null;
		}
	}

	get db() {
		return this._db;
	}

	get userCollection() {
		return this._userCollection;
	}

	get userCommandsCollection() {
		return this._userCommandsCollection;
	}

	get deviceResponsesCollection() {
		return this._deviceResponsesCollection;
	}
}

module.exports = MongoDatabase;
