'use strict';


const Net = require('net');
const Pino = require('pino');
const Aedes = require('aedes');
const Emitter = require('mqemitter-redis');
const Persistence = require('aedes-persistence-mongodb');
const Jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const parse = require('fast-json-parse');

const Mongo = require('./services/MongoDatabase');
const CacheHelper = require('./helpers/CacheHelper');
const DatabaseHelper = require('./helpers/DatabaseHelper');
const Utils = require('./utils/Utils');


/*

 Device will publish to these topics and user will subscribe
 DeviceId/response
 DeviceId/notification

 user will publish to these topics and device will subscribe
 DeviceId/command


 Caches for above
 For user:
 user:userId:tokens = ['token1', 'token2', 'token..n']
 user:userId:devices = ['homeid/devices/deviceid1', 'homeid/devices/deviceid2']

 For device:
 device:deviceId:token = 'token'
 device:deviceId:topic = 'homeid/devices/deviceid'

 'user:5710c8920839830600fd1ca0:tokens' = ['token1', 'token2']
 'user:5710c8920839830600fd1ca0:devices' = ['deviceId', 'deviceId']

 'device:5710c8920839830600fd1ca0:token' =  'token'
 'device:5710c8920839830600fd1ca0:topic' = 'homeid/devices/deviceid'




 */

/**
 *
 */
class Broker {


	constructor(options) {

		this._Options = options;

		this._logger = Pino();

		this._redis = new Redis(options.redis);
		this._mongo = new Mongo(options.database, this._logger);

		this._cacheHelper = new CacheHelper(this._redis, this._logger);
		this._dbHelper = new DatabaseHelper(this._mongo, this._logger);

		this._broker = null;
	}


	start() {

		this._mongo.connect();

		const self = this;
		const mqttOpt = this._Options.broker.mqtt;
		const emitterOptions = Object.assign({}, this._Options.broker.redis);

		const mq = Emitter(emitterOptions);
		const persistence = Persistence({url: this._Options.broker.database.uri});

		const settings = {
			mq: mq,
			persistence: persistence,
			concurrency: mqttOpt.concurrency,
			heartbeatInterval: mqttOpt.heartbeatInterval,
			connectTimeout: mqttOpt.connectTimeout,
			authenticate: this._onAuthenticate.bind(this),
			authorizePublish: this._onAuthorizePublish.bind(this),
			authorizeSubscribe: this._onAuthorizeSubscribe.bind(this)
		};


		const broker = Aedes(settings);

		const server = Net.createServer(broker.handle);
		server.listen(mqttOpt.port, function () {
			self._logger.info({port: mqttOpt.port}, 'MQTT broker listening');
		});


		this._broker = broker;
	}


	close() {
		this._logger.info('Graceful shutdown start');
		if (this._broker != null) {
			this._broker.close();
			this._broker = null;
		}

		this._mongo.close();
		this._redis.disconnect();
	}

	/**
	 * Returns Aedes instance
	 * @returns {Aedes}
	 */
	get broker() {
		return this._broker;
	}

	get mongo() {
		return this._mongo;
	}

	get redis() {
		return this._redis;
	}

	get cacheHelper() {
		return this._cacheHelper;
	}

	get dbHelper() {
		return this._dbHelper;
	}



	_onAuthenticate(client, username, passwordBuf, callback) {

		const token = Broker._parsePassword(passwordBuf, this._logger);

		// Inner function to handle callback
		const handleCallback = function (error) {
			if(error) {
				error.returnCode = error.returnCode || 5;
				callback(error, null);
			} else {
				client.role = token.role;
				client.uid = token.uid;
				callback(null, true);
			}
		};


		if (token == null) {
			const error = new Error('Connection Refused, bad user name or password');
			error.returnCode = 4;
			this._logger.error(error);
			handleCallback(error);
			return;
		}

		const password = passwordBuf.toString();
		if (token.role == 'user') {
			this._cacheHelper.authenticateUser(password, token, handleCallback);
		}

		else if (token.role == 'device') {
			this._cacheHelper.authenticateDevice(password, token, handleCallback);
		}

		else if (token.role == 'reg') { // reg = registration
			this._cacheHelper.authenticateUnRegisteredClient(password, token, handleCallback);
		}

		else {
			const error = new Error('Connection Refused, not authorized');
			handleCallback(error);
		}

		console.log('onAuthenticate', password);
	}



	_onAuthorizePublish(client, packet, callback) {

		// Inner function to handle callback
		const handleCallback = function (error) {
			if(error) {
				callback(error);
			} else {
				// here we also need to insert data into database
				callback(null);
			}
		};

		const self = this;
		const topic = packet.topic;
		if(client.role == 'user') {
			const userId = client.uid;
			this._cacheHelper.authorizeUserPublish(topic, userId, handleCallback);

		}else if(client.role == 'device') {
			const deviceId = client.uid;
			this._cacheHelper.authorizeDevicePublish(topic, deviceId, handleCallback);

		} else if(client.role == 'reg') {
			if(topic != 'device/register') {
				handleCallback(new Error('Invalid client state'));
			} else {
				const payload = packet.payload;
				self._dbHelper.registerDevice(payload, function (err, data) {
					if(err) {
						handleCallback(err);
					} else{
						console.log('I am success', data);
						handleCallback();
					}
				});
			}

		}
	}



	_onAuthorizeSubscribe(client, sub, callback) {

		// Inner function to handle callback
		const handleCallback = function (error) {
			if(error) {
				callback(error);
			} else {
				callback(null, sub);
			}
		};


		console.log(sub);
		const topic = sub.topic;
		if (topic === '') {
			return callback(new Error('Wrong topic'))

		}

		if(client.role == 'user') {
			const userId = client.uid;
			this._cacheHelper.authorizeUserSubscribe(topic, userId, handleCallback);
		} else if(client.role == 'device') {
			const deviceId = client.uid;
			this._cacheHelper.authorizeDeviceSubscribe(topic, deviceId, handleCallback);
		} else {
			this._logger.info('Client with unknown role trying to subscribe to ' + topic);
			handleCallback(new Error('Invalid client state'));
		}
	}


	static _parsePassword(password, logger) {
		if (!password) { // if password undefined
			return null;
		}

		const token = password.toString(); // if password token is empty
		if (token.length == 0) {
			return null;
		}

		let decodedPayload = null;
		try {
			decodedPayload = Jwt.decode(token);
		} catch (e) {
			logger.error(e);
		}

		return decodedPayload;
	}


}

module.exports = Broker;
