'use strict';

const _ = require('lodash');
const Jwt = require('jsonwebtoken');
const parse = require('fast-json-parse');

const Utils = require('../utils/Utils');


class CacheHelper {

	constructor(redis, logger) {
		this._redis = redis;
		this._logger = logger;
	}


	authenticateUser(password, token, callback) {
		/*
		 - We have this in cache
		 * user:userId:tokens = ['token1', 'token2', 'token..n']
		 */
		const self = this;
		const userId = token.uid;

		const key = 'user:' + userId + ':tokens';
		this._redis.get(key, function (err, tokensStr) {

			if (err) {
				self._logger.error(err);
				callback(err);

			} else {
				let allOkay = false;

				if (!tokensStr) {
					self._logger.info('User token not found', {token: password});
				} else {
					const tokensResult = parse(tokensStr);
					if (tokensResult.err) {
						self._logger.error(tokensResult.err);
					} else {
						const tokens = tokensResult.value;
						for (let i = 0; i < tokens.length; i++) {
							const t = tokens[i];
							if (t == password) {
								allOkay = true;
								break;
							}
						}
					}
				}

				if (allOkay) {
					callback(null);
				} else {
					const error = new Error('Connection Refused, not authorized');
					callback(error);
				}
			}
		});
	}


	authenticateDevice(password, token, callback) {
		/*
		 - We have this cache
		 * device:deviceId:token = 'token'
		 */

		const self = this;
		const deviceId = token.uid;

		const key = 'device:' + deviceId + ':token'; // token of a device, a device could have only one token at a time, 'token'
		this._redis.get(tokenKey, function (err, tokenStr) {

			if (err) {
				self._logger.error(err);
				callback(err);

			} else {
				let allOkay = false;

				if (!tokenStr) {
					self._logger.info('Device token not found', {token: password});
				} else {
					if (tokenStr == password) {
						allOkay = true;
					}
				}

				if (allOkay) {
					callback(null);
				} else {
					const error = new Error('Connection Refused, not authorized');
					callback(error);
				}
			}
		});
	}


	authenticateUnRegisteredClient(password, token, callback) {
		const self = this;
		const userId = token.uid;
		const signerKey = 'user:' + userId + ':signerKey'; // signer key

		this._redis.get(signerKey, function (err, signerKeyVal) {

			if (err) {
				self._logger.error(err);
				callback(err);
			} else {
				if (!signerKeyVal) {
					self._logger.info('User token not found', {token: password});

					const error = new Error('Connection Refused, not authorized');
					callback(error);
				} else {

					Jwt.verify(password, signerKeyVal, function (jwtErr, decoded) {
						if (jwtErr) {
							const error = new Error('Connection Refused, registration token expired');
							callback(error);
						} else {
							callback(null);
						}
					});
				}
			}
		});
	}




	authorizeUserPublish(topic, userId, callback) {
		/*
		 - User can publish to these
		 * deviceId/command

		 - We have this cache
		 * user:userId:devices = ['homeid/devices/deviceid1', 'homeid/devices/deviceid2']
		 */

		const self = this;

		const topicParts = Utils.topicParts(topic);
		if (!topicParts) {
			return callback(new Error('wrong topic'));
		}

		const key = 'user:' + userId + ':devices';
		this._redis.get(key, function (err, devicesStr) {

			if (err) {
				self._logger.error(err);
				callback(err);
			} else {
				let allOkay = false;

				if (!devicesStr) {
					self._logger.info('User devices key is empty');
				} else {
					const devicesResult = parse(devicesStr);
					if (devicesResult.err) {
						self._logger.error(devicesResult.err);
					} else {
						const devices = devicesResult.value;
						for (let i = 0; i < devices.length; i++) {
							const d = devices[i];
							if (d == topicParts.device) {
								allOkay = true;
								break;
							}
						}
					}
				}

				if (allOkay) {
					callback(null);
				} else {
					callback(new Error('Connection Refused, not authorized'));
				}
			}
		});
	}


	authorizeDevicePublish(topic, deviceId, callback) {
		/*
		 - Device can publish to these
		 * deviceId/response
		 * deviceId/notification

		 - We have this cache
		 * device:deviceId:topic = 'deviceid'
		 */
		const self = this;
		const topicParts = Utils.topicParts(topic);
		if (!topicParts) {
			return callback(new Error('Wrong topic'));
		}

		if(topicParts.action != 'response' || topicParts.action != 'notification') {
			return callback(new Error('Invalid action ' + topicParts.action));
		}

		const key = 'device:' + deviceId + ':topic';
		this._redis.get(key, function (err, deviceTopicStr) {

			if (err) {
				self._logger.error(err);
				callback(err);
			} else {
				let allOkay = false;

				if (!deviceTopicStr) {
					self._logger.info('Device key is empty');
				} else {
					if(topicParts.device == deviceTopicStr) {
						allOkay = true;
					} else{
						self._logger.info('Device topic not matched');
					}
				}

				if (allOkay) {
					callback(null);
				} else {
					callback(new Error('Connection Refused, not authorized'));
				}
			}
		});

	}




	authorizeUserSubscribe(topic, userId, callback) {
		/*
		- User can subscribe to these
		* deviceid/response
		* deviceid/notification

		- We have this cache
		* user:userId:devices = ['deviceid1', 'deviceid2']
		*/
		const self = this;
		const topicParts = Utils.topicParts(topic);
		if (!topicParts) {
			return callback(new Error('Wrong topic'));
		}

		if(topicParts.action != 'response' || topicParts.action != 'notification') {
			return callback(new Error('Invalid action ' + topicParts.action));
		}

		const key = 'user:' + userId + ':devices';
		this._redis.get(key, function (err, devicesStr) {

			if (err) {
				self._logger.error(err);
				callback(err);
			} else {
				let allOkay = false;

				if (!devicesStr) {
					self._logger.info('User devices key is empty');
				} else {
					const devicesResult = parse(devicesStr);
					if (devicesResult.err) {
						self._logger.error(devicesResult.err);
					} else {
						const devices = devicesResult.value;
						for (let i = 0; i < devices.length; i++) {
							const d = devices[i];
							if (d == topicParts.device) {
								allOkay = true;
								break;
							}
						}
					}
				}

				if (allOkay) {
					callback(null);
				} else {
					callback(new Error('Connection Refused, not authorized'));
				}
			}
		});
	}


	authorizeDeviceSubscribe(topic, deviceId, callback) {
		/*
		 - Device can subscribe to these
		 * homeid/devices/deviceid/command

		 - We have this cache
		 * device:deviceId:topic = 'homeid/devices/deviceid'
		 */
		const self = this;
		const topicParts = Utils.topicParts(topic);
		if (!topicParts) {
			return callback(new Error('Wrong topic'));
		}

		if(topicParts.action != 'command') {
			return callback(new Error('Invalid action ' + topicParts.action));
		}

		const key = 'device:' + deviceId + ':topic';
		this._redis.get(key, function (err, topicStr) {

			if (err) {
				self._logger.error(err);
				callback(err);
			} else {
				let allOkay = false;

				if (!topicStr) {
					self._logger.info('Device topic key is empty');
				} else {
					if(topicParts.device == topicStr) {
						allOkay = true;
					}
				}

				if (allOkay) {
					callback(null);
				} else {
					callback(new Error('Connection Refused, not authorized'));
				}
			}
		});
	}

}


module.exports = CacheHelper;
