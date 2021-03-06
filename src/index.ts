/// <reference types="node" />

import request = require('request');
// import mqtt = require('mqtt');
import Q = require('q');
import low = require('lowdb');
import fs = require('fs');

(function () {
    var dir = './resource';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
})();
var db = new low('./resource/db.json');

export let appID: string;
export let appKey: string;
export let site: string;
let messageHandler;

// kii init
export function init(_appID, _appKey, _site) {
    db.defaults({ app: {}, gateway: {}, endNodes: [] }).value();
    appID = _appID;
    appKey = _appKey;
    site = _site;
    db.set('app.appID', appID).value();
    db.set('app.appKey', appKey).value();
    db.set('app.site', site).value();
}

// onboard gateway by owner
export function onboardGatewayByOwner(ownerToken, ownerID, vendorThingID, password, type, properties) {
    let deferred = Q.defer()
    let options = {
        method: 'POST',
        url: site + '/thing-if/apps/' + appID + '/onboardings',
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

    request(options, (error, response, body) => {
        if (error) deferred.reject(new Error(error))

        db.set('gateway.vendorThingID', vendorThingID).value()
        db.set('gateway.thingID', JSON.parse(body).thingID).value()
        db.set('gateway.accessToken', JSON.parse(body).accessToken).value()

        deferred.resolve({
            gatewayInfo: JSON.parse(body)
        })
    });

    return deferred.promise
}

// onboard endnode with gateway by owner
export function onboardEndnodeByOwner(ownerToken, ownerID, endNodeVendorThingID, endNodePassword, type, properties) {
    let gatewayThingID = db.get('gateway.thingID').value();
    let deferred = Q.defer()
    let options = {
        method: 'POST',
        url: site + '/thing-if/apps/' + appID + '/onboardings',
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

    request(options, (error, response, body) => {
        if (error) deferred.reject(new Error(error))

        if (db.get('endNodes').find({ 'vendorThingID': endNodeVendorThingID }).value())
            db.get('endNodes').find({ 'vendorThingID': endNodeVendorThingID }).assign({
                vendorThingID: endNodeVendorThingID,
                accessToken: JSON.parse(body).accessToken,
                endNodeThingID: JSON.parse(body).endNodeThingID
            }).value()
        else {
            if (!db.has('endNodes').value()) db.set('endNodes', []).value();
            db.get('endNodes').push({
                vendorThingID: endNodeVendorThingID,
                accessToken: JSON.parse(body).accessToken,
                endNodeThingID: JSON.parse(body).endNodeThingID
            }).value();
        }
        deferred.resolve(JSON.parse(body))
    });

    return deferred.promise
}

// update endnode state
export function updateEndnodeState(ownerToken, endNodeThingID, states) {
    let deferred = Q.defer()
    let options = {
        method: 'PUT',
        url: site + `/thing-if/apps/${appID}/targets/thing:${endNodeThingID}/states`,
        headers: {
            authorization: 'Bearer ' + ownerToken,
            'content-type': 'application/json'
        },
        body: JSON.stringify(states)
    };
    request(options, (error, response, body) => {
        if (error) deferred.reject(new Error(error));
        if (response.statusCode !== 204) deferred.reject(body);
        deferred.resolve(response.statusCode);
    });
    return deferred.promise
}

// update endnode connectivity
export function updateEndnodeConnectivity(ownerToken: string, endNodeThingID: string, online: boolean) {
    let gatewayThingID = db.get('gateway.thingID').value();
    let deferred = Q.defer()
    let options = {
        method: 'PUT',
        url: site + `/thing-if/apps/${appID}/things/${gatewayThingID}/end-nodes/${endNodeThingID}/connection`,
        headers: {
            authorization: 'Bearer ' + ownerToken,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            'online': online
        })
    };
    request(options, (error, response, body) => {
        if (error) deferred.reject(new Error(error));
        if (response.statusCode !== 204) deferred.reject(body);
        deferred.resolve(response.statusCode);
    });
    return deferred.promise
}

// retrive endnode onboarding status
export function detectEndnodeOnboardingStatus(endNodeVendorThingID: string): boolean {
    return !!db.get('endNodes').find({ vendorThingID: endNodeVendorThingID }).value();
}

// mqtt
// export function startCommandReceiver(chainInput) {
//     let deferred = Q.defer()
//     let gatewayInfo = chainInput.gatewayInfo
//     let mqttEndpoint = gatewayInfo.mqttEndpoint;
//     let option = {
//         'port': mqttEndpoint.portTCP,
//         'clientId': mqttEndpoint.mqttTopic,
//         'username': mqttEndpoint.username,
//         'password': mqttEndpoint.password,
//         'reconnectPeriod': 55000,
//         'keepalive': 60
//     }
//     console.log(mqttEndpoint)
//     let client = mqtt.connect('tcp://' + mqttEndpoint.host, option);
//     client.on('connect', connack => {
//         if (!connack.sessionPresent) {
//             client.subscribe(mqttEndpoint.mqttTopic, {
//                 qos: 0,
//                 retain: false
//             }, (err, granted) => {
//                 if (err) deferred.reject(err)
//             });
//         } else {
//             throw new Error('error connecting to MQTT broker')
//         }
//     })
//     client.on('error', error => {
//         throw new Error(error)
//     })
//     client.on('message', (topic, message, packet) => {
//         let i;
//         let messageStr = '';
//         for (i = 0; i < message.length; i++) {
//             messageStr += '%' + ('0' + message[i].toString(16)).slice(-2);
//         }
//         messageStr = decodeURIComponent(messageStr);
//         this.messageHandler(messageStr)
//     })
// }

// export function setOnCommandMessage(messageHandler) {
//     this.messageHandler = messageHandler
// }