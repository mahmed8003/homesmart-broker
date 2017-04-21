'use strict';

const exitHook = require('async-exit-hook');

const Broker = require('./Broker');
const config = require('./config');


const broker = new Broker(config);
broker.start();


exitHook(function () {
	broker.close();
});

