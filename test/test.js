"use strict";
var expect = require("expect.js");
// import gatewayAgent = require('../index')
var index_1 = require("../index");
describe('Kii Gateway Agent', function () {
    var gatewayAgent;
    describe('.init()', function () {
        beforeEach(function () {
            gatewayAgent = new index_1["default"]();
        });
        it('should set appID, appKey, site', function (done) {
            gatewayAgent.init('f1e14d7c', 'b5727ac2e89ff44268fd628c12da7d61', 'https://api-sg.kii.com');
            expect(gatewayAgent.appID).to.be('f1e14d7c');
            expect(gatewayAgent.appKey).to.be('b5727ac2e89ff44268fd628c12da7d61');
            expect(gatewayAgent.site).to.be('https://api-sg.kii.com');
            done();
        });
    });
    describe('.onboardGatewayByOwner()', function () {
        var result;
        beforeEach(function (done) {
            gatewayAgent.onboardGatewayByOwner('L_tj-jtSjDNYj1mRtJFKBD3eA5_x68AiFYQswS35TlA', // owner token
            'ba28b2d34b60-270b-6e11-e3dd-0240f4e2', //owner userid
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
            gatewayAgent.onboardEndnodeByOwner('L_tj-jtSjDNYj1mRtJFKBD3eA5_x68AiFYQswS35TlA', // owner token
            'ba28b2d34b60-270b-6e11-e3dd-0240f4e2', //owner userid
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
});
