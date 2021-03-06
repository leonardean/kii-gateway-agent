export declare let appID: string;
export declare let appKey: string;
export declare let site: string;
export declare function init(_appID: any, _appKey: any, _site: any): void;
export declare function onboardGatewayByOwner(ownerToken: any, ownerID: any, vendorThingID: any, password: any, type: any, properties: any): any;
export declare function onboardEndnodeByOwner(ownerToken: any, ownerID: any, endNodeVendorThingID: any, endNodePassword: any, type: any, properties: any): any;
export declare function updateEndnodeState(ownerToken: any, endNodeThingID: any, states: any): any;
export declare function updateEndnodeConnectivity(ownerToken: string, endNodeThingID: string, online: boolean): any;
export declare function detectEndnodeOnboardingStatus(endNodeVendorThingID: string): boolean;
