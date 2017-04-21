'use strict';

module.exports = {
	logger : {

	},

	database : {
		uri : process.env.MONGO_DEVICES_URI
	},

	redis : {
		port: 6379,          // Redis port
		host: process.env.REDIS_HOST,   // Redis host
		family: 4,           // 4 (IPv4) or 6 (IPv6)
		dropBufferSupport: true,
		db: 0
	},

	broker : {

		redis : {
			port: 6379,          // Redis port
			host: process.env.REDIS_HOST,   // Redis host
			family: 4,           // 4 (IPv4) or 6 (IPv6)
			db: 4
			//password: 'auth',
		},

		database : {
			uri : process.env.MONGO_BROKER_URI,
		},

		mqtt : {
			concurrency : 100,
			heartbeatInterval : 60000,
			connectTimeout : 30000,
			port : process.env.NODE_PORT
		}
	}
};


