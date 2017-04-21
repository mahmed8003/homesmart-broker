'use strict';

const _ = require('lodash');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectID;
const RandomString = require('randomstring');


const Validator = {
	MOBILE_NUMBER : /^\+?\d+$/,
	OBJECT_ID : /^[0-9a-fA-F]{24}$/
};

class DatabaseHelper {

	constructor(mongo, logger) {
		this._mongo = mongo;
		this._logger = logger;

		this._registerDeviceSchema = DatabaseHelper._getRegisterDeviceSchema();
		this._userCommandSchema = DatabaseHelper._getUserCommandSchema();
		this._deviceResponseSchema = DatabaseHelper._getDeviceResponseSchema();
	}


	registerDevice(payload, callback) {
		const self = this;

		Joi.validate(payload, this._registerDeviceSchema, function (err, value) {
			if(err) {
				self._logger.error(err);
				return;
			}

			const homeId = value.homeId;
			const ownerId = value.ownerId;

			const collection = this._mongo.homeCollection;
			const query = {'_id': new ObjectId(homeId), 'owner' : new ObjectId(ownerId)};
			const fields = {'devices': 1};

			collection.findOne(query, {fields: fields}, function (err, home) {
				console.log(err, home);

				if (err) {
					callback(err, null);
					return;
				}

				if (!home) {
					const error = new Error('Invalid home id');
					callback(error, null);
					return;
				}

				const now = Date.now();

				let device = _.find(home.devices, {'hardwareId': value.hardwareId});
				if(device) {
					const updatedDevice = Object.assign(device, {
						about : value.about,
						updatedAt : now,
						authToken : RandomString.generate({ length: 40, charset: 'alphanumeric'})
					});

					console.log('updatedDevice', updatedDevice);
					query['devices._id'] = device._id;
					collection.update(query, {$set: {'devices.$': updatedDevice}}, function (err, home) {
						console.log(err, home);
						if(err) {
							callback(err, null);
						} else{
							callback(null, updatedDevice);
						}
					});

				} else {
					const newDevice = {
						_id : new ObjectId(),
						name : value.name,
						hardwareId : value.hardwareId,
						mac : value.mac,
						about : value.about,
						createdAt : now,
						updatedAt : now,
						authToken : RandomString.generate({ length: 40, charset: 'alphanumeric'})
					};

					console.log('newDevice', newDevice);
					collection.updateOne(query, {$push: {'devices': newDevice}}, function (err, home) {
						console.log(err, home);
						if(err) {
							callback(err, null);
						} else{
							callback(null, newDevice);
						}
					});
				}
			});

		});

	}


	static _getRegisterDeviceSchema() {
		const schema =  Joi.object().keys({
			homeId: Joi.string().regex(Validator.OBJECT_ID).required(),
			name: Joi.string().required(),
			ownerId: Joi.string().regex(Validator.OBJECT_ID).required(),
			hardwareId: Joi.string().required(),
			mac: Joi.string().required(),
			about: Joi.object().keys({
				deviceType: Joi.string().required(),
				deviceId: Joi.string().required(),
				manufacturer: Joi.string().required(),
				model: Joi.string().required(),
				description: Joi.string().required(),
				dateOfManufacture: Joi.number().required(),
				softwareVersion: Joi.string().required(),
				hardwareVersion: Joi.string().required(),
				supportUrl: Joi.string().required()
			}).required()
		});

		return schema;
	}


	static _getUserCommandSchema() {
		const schema =  Joi.object().keys({});
		return schema;
	}

	static  _getDeviceResponseSchema() {
		const schema =  Joi.object().keys({});
		return schema;
	}



}



module.exports = DatabaseHelper;
