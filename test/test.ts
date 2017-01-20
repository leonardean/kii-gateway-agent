import expect = require('expect.js');
import request = require('request');
// import gatewayAgent = require('../lib/index');
import { gatewayAgent } from '../lib/index';

const appID = 'f1e14d7c';
const appKey = 'b5727ac2e89ff44268fd628c12da7d61';
const site = 'https://api-sg.kii.com';
const ownerToken = 'L_tj-jtSjDNYj1mRtJFKBD3eA5_x68AiFYQswS35TlA';
const ownerID = 'ba28b2d34b60-270b-6e11-e3dd-0240f4e2';

describe('Kii Gateway Agent', () => {
	describe('.init()', () => {
		it('should set appID, appKey, site', done => {
			gatewayAgent.init(appID, appKey, site);
			expect(gatewayAgent.appID).to.be(appID);
			expect(gatewayAgent.appKey).to.be(appKey);
			expect(gatewayAgent.site).to.be(site);
			done();
		})
	});

	describe('.onboardGatewayByOwner()', () => {
		let result
		beforeEach(done => {
			gatewayAgent.onboardGatewayByOwner(
				ownerToken, // owner token
				ownerID, //owner userid
				'BABY5', //gateway vendorThingID
				'123123', //gateway password
				'toy', // thing type
				undefined) // thing properties
				.then(chainOutput => {
					result = chainOutput
					done()
				})
		})
		it('should onboard gateway', () => {
			expect(result.gatewayInfo.thingID).to.be('th.7c698b427320-f689-6e11-b4dd-0cd49ec9')
			expect(result.gatewayInfo.mqttEndpoint).to.be.an('object')
		})
	});

	describe('.onboardEndnodeByOwner()', () => {
		let result
		beforeEach(done => {
			gatewayAgent.onboardEndnodeByOwner(
				ownerToken, // owner token
				ownerID, //owner userid
				'Donkey', // endnode vendorThingID
				'123123', // endnode password
				'toy', // endnode type
				undefined) // endnode properties
				.then(chainOutput => {
					result = chainOutput
					done()
				})
		})
		it('should onboard end node', () => {
			expect(result.endNodeThingID).to.be('th.7c698b427320-f689-6e11-06dd-0d68ad02')
		})
	});

	describe('.updateEndnodeState()', () => {
		let result
		beforeEach(done => {
			gatewayAgent.updateEndnodeState(
				ownerToken, // owner token
				'th.7c698b427320-f689-6e11-06dd-0d68ad02', // endnode vendorThingID
				{
					'batteryAlias': {
						'power': true
					},
					'lampAlias': {
						'power': true
					}
				} // endnode states
			).then(chainOutput => {
				result = chainOutput
				done()
			})
		})
		it('should update endnode states', () => {
			expect(result).to.be(204);
		})
	});

	describe('.updateEndnodeConnectivity()', () => {
		let result
		beforeEach(done => {
			gatewayAgent.updateEndnodeConnectivity(
				ownerToken, // owner token
				'th.7c698b427320-f689-6e11-06dd-0d68ad02', // endnode vendorThingID
				true //online
			).then(chainOutput => {
				result = chainOutput
				done()
			})
		})
		it('should update endnode connection status', () => {
			expect(result).to.be(204);
		})
	});

	describe('.detectEndnodeOnboardingStatus()', () => {
		let donkey;
		let notExistingDonkey;
		beforeEach(done => {
			donkey = gatewayAgent.detectEndnodeOnboardingStatus('Donkey');
			notExistingDonkey = gatewayAgent.detectEndnodeOnboardingStatus('notExistingDonkey');
			done();
		})
		it('should return if endnode is onboarding or not', () => {
			expect(donkey).to.be(true)
			expect(notExistingDonkey).to.be(false)
		})
	});
})