'use strict';

const Jwt = require('jsonwebtoken');
const Redis = require('ioredis');

const usersData = {};
const userOneId = '589c7035920a510f6786bd67';
const userTwoId = '589c70463667aa0f69f5c5ac';


const redisOpt = {
		port: 6379,          // Redis port
		host: '127.0.0.1',   // Redis host
		family: 4,           // 4 (IPv4) or 6 (IPv6)
		dropBufferSupport: true,
		db: 0
};

const redis = Redis(redisOpt);


function generateToken(userId) {
	const appId = 'eyPRFBAuLtxa';
	const appSecret = 'Pm6HyGtxJNQt95ubXkzBKyss';

	const now = Date.now(); // Time in milli seconds
	const expires = now + 13824000000;
	const payload = {
		uid: userId,
		exp: expires,
		iat: now,
		role: 'user',
		appId: appId
	};

	return Jwt.sign(payload, appSecret);
}

function insertUserTokens() {
	const userOneTokens = [];
	const userTwoTokens = [];
	for(let i = 0; i < 5; i++) {
		userOneTokens.push(generateToken(userOneId));
		if(i != 2) { // creating one less token
			userTwoTokens.push(generateToken(userTwoId));
		}
	}


	usersData[userOneId] = userOneTokens;
	usersData[userTwoId] = userTwoTokens;

	const userOneTokensStr = JSON.stringify(userOneTokens);
	const userTwoTokensStr = JSON.stringify(userTwoTokens);

	//user:userId:tokens = ['token1', 'token2', 'token..n']
	const key1 = 'user:' + userOneId + ':tokens';
	const key2 = 'user:' + userTwoId + ':tokens';

	redis.set(key1, userOneTokensStr);
	redis.set(key2, userTwoTokensStr);

	console.log('user one', userOneId);
	console.log('user two', userTwoId);
	console.log('user tokens inserted');
}


insertUserTokens();
