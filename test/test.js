"use strict";
var expect = require("expect.js");
var gatewayAgent = require("../lib/index");
var appID = 'f1e14d7c';
var appKey = 'b5727ac2e89ff44268fd628c12da7d61';
var site = 'https://api-sg.kii.com';
var ownerToken = 'L_tj-jtSjDNYj1mRtJFKBD3eA5_x68AiFYQswS35TlA';
var ownerID = 'ba28b2d34b60-270b-6e11-e3dd-0240f4e2';
describe('Kii Gateway Agent', function () {
    describe('.init()', function () {
        it('should set appID, appKey, site', function (done) {
            gatewayAgent.init(appID, appKey, site);
            expect(gatewayAgent.appID).to.be(appID);
            expect(gatewayAgent.appKey).to.be(appKey);
            expect(gatewayAgent.site).to.be(site);
            done();
        });
    });
    describe('.onboardGatewayByOwner()', function () {
        var result;
        beforeEach(function (done) {
            gatewayAgent.onboardGatewayByOwner(ownerToken, // owner token
            ownerID, //owner userid
            'BABY5', //gateway vendorThingID
            '123123', //gateway password
            'toy', // thing type
            undefined) // thing properties
                .then(function (chainOutput) {
                result = chainOutput;
                done();
            });
        });
        it('should onboard gateway', function () {
            expect(result.gatewayInfo.thingID).to.be('th.7c698b427320-f689-6e11-b4dd-0cd49ec9');
            expect(result.gatewayInfo.mqttEndpoint).to.be.an('object');
        });
    });
    describe('.onboardEndnodeByOwner()', function () {
        var result;
        beforeEach(function (done) {
            gatewayAgent.onboardEndnodeByOwner(ownerToken, // owner token
            ownerID, //owner userid
            'Donkey', // endnode vendorThingID
            '123123', // endnode password
            'toy', // endnode type
            undefined) // endnode properties
                .then(function (chainOutput) {
                result = chainOutput;
                done();
            });
        });
        it('should onboard end node', function () {
            expect(result.endNodeThingID).to.be('th.7c698b427320-f689-6e11-06dd-0d68ad02');
        });
    });
    describe('.updateEndnodeState()', function () {
        var result;
        beforeEach(function (done) {
            gatewayAgent.updateEndnodeState(ownerToken, // owner token
            'th.7c698b427320-f689-6e11-06dd-0d68ad02', // endnode vendorThingID
            {
                'batteryAlias': {
                    'power': true
                },
                'lampAlias': {
                    'power': true
                }
            } // endnode states
            ).then(function (chainOutput) {
                result = chainOutput;
                done();
            });
        });
        it('should update endnode states', function () {
            expect(result).to.be(204);
        });
    });
    describe('.updateEndnodeConnectivity()', function () {
        var result;
        beforeEach(function (done) {
            gatewayAgent.updateEndnodeConnectivity(ownerToken, // owner token
            'th.7c698b427320-f689-6e11-06dd-0d68ad02', // endnode vendorThingID
            true //online
            ).then(function (chainOutput) {
                result = chainOutput;
                done();
            });
        });
        it('should update endnode connection status', function () {
            expect(result).to.be(204);
        });
    });
    describe('.detectEndnodeOnboardingStatus()', function () {
        var donkey;
        var notExistingDonkey;
        beforeEach(function (done) {
            donkey = gatewayAgent.detectEndnodeOnboardingStatus('Donkey');
            notExistingDonkey = gatewayAgent.detectEndnodeOnboardingStatus('notExistingDonkey');
            done();
        });
        it('should return if endnode is onboarding or not', function () {
            expect(donkey).to.be(true);
            expect(notExistingDonkey).to.be(false);
        });
    });
});
