"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudProviderFactory = exports.cloudProviderMap = exports.Azure = void 0;
const aws_1 = require("./aws");
class Azure {
    init() {
        return 'Azure';
    }
}
exports.Azure = Azure;
exports.cloudProviderMap = {
    aws: aws_1.Aws,
    azure: Azure
};
class CloudProviderFactory {
    static getInstance(cloudProviderKey) {
        return new exports.cloudProviderMap[cloudProviderKey]();
    }
}
exports.CloudProviderFactory = CloudProviderFactory;
// const terraform = CloudProviderFactory.getInstance("terraform");
// const cloudformation = CloudProviderFactory.getInstance("cloudformation");
// console.log(
//   "IaS cloudProvider type: ",
//   new CloudProviderService().getInstanceByType("cloudformation")
// );
// console.log(
//     "IaS cloudProvider type: ",
//     new CloudProviderService().getInstanceByType("terraform")
//   );
