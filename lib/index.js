"use strict";
var request = require("request");
var mqtt = require("mqtt");
var Q = require("q");
var low = require("lowdb");
var db = new low('resource/db.json');
var messageHandler;
// kii init
function init(_appID, _appKey, _site) {
    exports.appID = _appID;
    exports.appKey = _appKey;
    exports.site = _site;
    db.set('app.appID', exports.appID).value();
    db.set('app.appKey', exports.appKey).value();
    db.set('app.site', exports.site).value();
}
exports.init = init;
// onboard gateway by owner
function onboardGatewayByOwner(ownerToken, ownerID, vendorThingID, password, type, properties) {
    var deferred = Q.defer();
    var options = {
        method: 'POST',
        url: exports.site + '/thing-if/apps/' + exports.appID + '/onboardings',
        headers: {
            authorization: 'Bearer ' + ownerToken,
            'content-type': 'application/vnd.kii.onboardingWithVendorThingIDByOwner+json'
        },
        body: JSON.stringify({
            'vendorThingID': vendorThingID,
            'thingPassword': password,
            'owner': 'USER:' + ownerID,
            'thingType': type,
            'layoutPosition': 'GATEWAY'
        })
    };
    request(options, function (error, response, body) {
        if (error)
            deferred.reject(new Error(error));
        db.set('gateway.vendorThingID', vendorThingID).value();
        db.set('gateway.thingID', JSON.parse(body).thingID).value();
        db.set('gateway.accessToken', JSON.parse(body).accessToken).value();
        deferred.resolve({
            gatewayInfo: JSON.parse(body)
        });
    });
    return deferred.promise;
}
exports.onboardGatewayByOwner = onboardGatewayByOwner;
// onboard endnode with gateway by owner
function onboardEndnodeByOwner(ownerToken, ownerID, endNodeVendorThingID, endNodePassword, type, properties) {
    var gatewayThingID = db.get('gateway.thingID').value();
    var deferred = Q.defer();
    var options = {
        method: 'POST',
        url: exports.site + '/thing-if/apps/' + exports.appID + '/onboardings',
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
    };
    request(options, function (error, response, body) {
        if (error)
            deferred.reject(new Error(error));
        if (db.get('endNodes').find({ 'vendorThingID': endNodeVendorThingID }).value())
            db.get('endNodes').find({ 'vendorThingID': endNodeVendorThingID }).assign({
                vendorThingID: endNodeVendorThingID,
                accessToken: JSON.parse(body).accessToken,
                endNodeThingID: JSON.parse(body).endNodeThingID
            }).value();
        else
            db.get('endNodes').push({
                vendorThingID: endNodeVendorThingID,
                accessToken: JSON.parse(body).accessToken,
                endNodeThingID: JSON.parse(body).endNodeThingID
            }).value();
        deferred.resolve(JSON.parse(body));
    });
    return deferred.promise;
}
exports.onboardEndnodeByOwner = onboardEndnodeByOwner;
// update endnode state
function updateEndnodeState(ownerToken, endNodeThingID, states) {
    var deferred = Q.defer();
    var options = {
        method: 'PUT',
        url: exports.site + ("/thing-if/apps/" + exports.appID + "/targets/thing:" + endNodeThingID + "/states"),
        headers: {
            authorization: 'Bearer ' + ownerToken,
            'content-type': 'application/json'
        },
        body: JSON.stringify(states)
    };
    request(options, function (error, response, body) {
        if (error)
            deferred.reject(new Error(error));
        if (response.statusCode !== 204)
            deferred.reject(body);
        deferred.resolve(response.statusCode);
    });
    return deferred.promise;
}
exports.updateEndnodeState = updateEndnodeState;
// TODO update endnode connectivity
function updateEndnodeConnectivity(ownerToken, endNodeThingID, online) {
    var gatewayThingID = db.get('gateway.thingID').value();
    var deferred = Q.defer();
    var options = {
        method: 'PUT',
        url: exports.site + ("/thing-if/apps/" + exports.appID + "/things/" + gatewayThingID + "/end-nodes/" + endNodeThingID + "/connection"),
        headers: {
            authorization: 'Bearer ' + ownerToken,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            'online': online
        })
    };
    request(options, function (error, response, body) {
        if (error)
            deferred.reject(new Error(error));
        if (response.statusCode !== 204)
            deferred.reject(body);
        deferred.resolve(response.statusCode);
    });
    return deferred.promise;
}
exports.updateEndnodeConnectivity = updateEndnodeConnectivity;
// retrive endnode onboarding status
function detectEndnodeOnboardingStatus(endNodeVendorThingID) {
    return !!db.get('endNodes').find({ vendorThingID: endNodeVendorThingID }).value();
}
exports.detectEndnodeOnboardingStatus = detectEndnodeOnboardingStatus;
// mqtt
function startCommandReceiver(chainInput) {
    var _this = this;
    var deferred = Q.defer();
    var gatewayInfo = chainInput.gatewayInfo;
    var mqttEndpoint = gatewayInfo.mqttEndpoint;
    var option = {
        'port': mqttEndpoint.portTCP,
        'clientId': mqttEndpoint.mqttTopic,
        'username': mqttEndpoint.username,
        'password': mqttEndpoint.password,
        'reconnectPeriod': 55000,
        'keepalive': 60
    };
    console.log(mqttEndpoint);
    var client = mqtt.connect('tcp://' + mqttEndpoint.host, option);
    client.on('connect', function (connack) {
        if (!connack.sessionPresent) {
            client.subscribe(mqttEndpoint.mqttTopic, {
                qos: 0,
                retain: false
            }, function (err, granted) {
                if (err)
                    deferred.reject(err);
            });
        }
        else {
            throw new Error('error connecting to MQTT broker');
        }
    });
    client.on('error', function (error) {
        throw new Error(error);
    });
    client.on('message', function (topic, message, packet) {
        var i, messageStr = '';
        for (i = 0; i < message.length; i++) {
            messageStr += '%' + ('0' + message[i].toString(16)).slice(-2);
        }
        messageStr = decodeURIComponent(messageStr);
        _this.messageHandler(messageStr);
    });
}
exports.startCommandReceiver = startCommandReceiver;
function setOnCommandMessage(messageHandler) {
    this.messageHandler = messageHandler;
}
exports.setOnCommandMessage = setOnCommandMessage;
