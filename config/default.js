'use strict';

module.exports = {

	logger : {

	},

	database : {
		uri : 'mongodb://localhost/devices-development'
	},

	redis : {
		port: 6379,          // Redis port
		host: '127.0.0.1',   // Redis host
		family: 4,           // 4 (IPv4) or 6 (IPv6)
		dropBufferSupport: true,
		db: 0
	},

	broker : {

		redis : {
			port: 6379,          // Redis port
			host: '127.0.0.1',   // Redis host
			family: 4,           // 4 (IPv4) or 6 (IPv6)
			db: 4
			//password: 'auth',
		},

		database : {
			uri : 'mongodb://localhost/mqttbroker',
		},

		mqtt : {
			concurrency : 100,
			heartbeatInterval : 60000,
			connectTimeout : 30000,
			port : 1883
		}
	}
};
