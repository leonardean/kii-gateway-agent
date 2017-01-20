export declare module gatewayAgent {
    let appID: string;
    let appKey: string;
    let site: string;
    function init(_appID: any, _appKey: any, _site: any): void;
    function onboardGatewayByOwner(ownerToken: any, ownerID: any, vendorThingID: any, password: any, type: any, properties: any): any;
    function onboardEndnodeByOwner(ownerToken: any, ownerID: any, endNodeVendorThingID: any, endNodePassword: any, type: any, properties: any): any;
    function updateEndnodeState(ownerToken: any, endNodeThingID: any, states: any): any;
    function updateEndnodeConnectivity(ownerToken: string, endNodeThingID: string, online: boolean): any;
    function detectEndnodeOnboardingStatus(endNodeVendorThingID: string): boolean;
    function startCommandReceiver(chainInput: any): void;
    function setOnCommandMessage(messageHandler: any): void;
}
