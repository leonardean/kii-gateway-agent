'use strict';
var request = require('request')
var mqtt = require('mqtt')
var Q = require('q')
var low = require('lowdb')
var db = low('db.json')

var gatewayAgent = {

	init: function (appID, appKey, site) {
		this.appID = appID
		this.appKey = appKey
		this.site = site
		db.set('app.appID', appID).value()
		db.set('app.appKey', appKey).value()
		db.set('app.site', site).value()
	},

	onboardGatewayByOwner: function(ownerToken, ownerID, vendorThingID, password, type, properties) {
		var deferred = Q.defer()
		var options = {
			method: 'POST',
			url: this.site + '/thing-if/apps/' + this.appID + '/onboardings',
			headers: {
				authorization: 'Bearer ' + ownerToken,
				'content-type': 'application/vnd.kii.onboardingWithVendorThingIDByOwner+json'
			},
			body: JSON.stringify({
				"vendorThingID": vendorThingID,
			  "thingPassword": password,
			  "owner": "USER:" + ownerID,
			  "thingType": type,
			  "layoutPosition": "GATEWAY"
			})
		};

		request(options, function(error, response, body) {
			if (error) deferred.reject(new Error(error))

			db.set('gateway.vendorThingID', vendorThingID).value()
			db.set('gateway.thingID', JSON.parse(body).thingID).value()
			db.set('gateway.accessToken', JSON.parse(body).accessToken).value()

			deferred.resolve({
				gatewayInfo: JSON.parse(body)
			})
		});

		return deferred.promise
	},

	onboardEndnodeByOwner: function (ownerToken, ownerID, endNodeVendorThingID, endNodePassword, type, properties) {
		var gatewayThingID = db.get('gateway.thingID')
		var deferred = Q.defer()
		var options = {
			method: 'POST',
			url: this.site + '/thing-if/apps/' + this.appID + '/onboardings',
			headers: {
				authorization: 'Bearer ' + ownerToken,
				'content-type': 'application/vnd.kii.OnboardingEndNodeWithGatewayThingID+json'
			},
			body: JSON.stringify({
				'endNodeVendorThingID': endNodeVendorThingID,
				'endNodePassword': endNodePassword,
				'gatewayThingID': gatewayThingID,
				'endNodeThingProperties': properties,
				'endNodeThingType': type,
				'owner': 'USER:' + ownerID
			})
		}

		request(options, function(error, response, body) {
			if (error) deferred.reject(new Error(error))

			if (db.get('endNodes').find({'vendorThingID': endNodeVendorThingID}).value())
				db.get('endNodes').find({'vendorThingID': endNodeVendorThingID}).assign({
					vendorThingID: endNodeVendorThingID,
					accessToken: JSON.parse(body).accessToken,
					endNodeThingID: JSON.parse(body).endNodeThingID
				}).value()
			else 
				db.get('endNodes').push({
					vendorThingID: endNodeVendorThingID,
					accessToken: JSON.parse(body).accessToken,
					endNodeThingID: JSON.parse(body).endNodeThingID
				}).value()
			deferred.resolve(JSON.parse(body))
		})

		return deferred.promise
	},

	updateEndnodeState: function (thingID, state) {

	},

	updateEndnodeConnectivity: function (thingID, connected) {

	},

	startCommandReceiver: function(chainInput) {
		gatewayInfo = chainInput.gatewayInfo
		var mqttEndpoint = gatewayInfo.mqttEndpoint;
		var option = {
			"port": mqttEndpoint.portTCP,
			"clientId": mqttEndpoint.mqttTopic,
			"username": mqttEndpoint.username,
			"password": mqttEndpoint.password,
			"reconnectPeriod": 55000,
			"keepalive": 60
		}
		console.log(mqttEndpoint)
		var client = mqtt.connect('tcp://' + mqttEndpoint.host, option);
		client.on('connect', function(connack) {
			if (!connack.sessionPresent) {
				client.subscribe(mqttEndpoint.mqttTopic, {
					qos: 0,
					retain: false
				}, function(err, granted) {
					if (err) deferred.reject(err)
				});
			} else {
				throw new Error("error connecting to MQTT broker")
			}
		})
		client.on('error', function(error) {
			throw new Error(error)
		})
		client.on('message', function(topic, message, packet) {
			var i, messageStr = '';
			for (i = 0; i < message.length; i++) {
				messageStr += '%' + ('0' + message[i].toString(16)).slice(-2);
			}
			messageStr = decodeURIComponent(messageStr);
			this.messageHandler(messageStr)
		})
	},

	setOnCommandMessage: function(messageHandler) {
		this.messageHandler = messageHandler
	}
}

module.exports = gatewayAgent