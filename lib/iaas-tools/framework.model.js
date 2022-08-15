"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameworkFactory = exports.frameworkMap = exports.CloudFormation = void 0;
const terraform_1 = require("./terraform");
class CloudFormation {
    constructor() {
        this.fileTypes = ['json', 'yaml'];
    }
    init() {
        return 'CloudFormation';
    }
    check(foldersToRunCheck, workDir) {
    }
}
exports.CloudFormation = CloudFormation;
exports.frameworkMap = {
    terraform: terraform_1.Terraform,
    cloudformation: CloudFormation
};
class FrameworkFactory {
    static getInstance(frameworkKey) {
        return new exports.frameworkMap[frameworkKey]();
    }
}
exports.FrameworkFactory = FrameworkFactory;
// const terraform = FrameworkFactory.getInstance("terraform");
// const cloudformation = FrameworkFactory.getInstance("cloudformation");
// console.log(
//   "IaS framework type: ",
//   new FrameworkService().getInstanceByType("cloudformation")
// );
// console.log(
//     "IaS framework type: ",
//     new FrameworkService().getInstanceByType("terraform")
//   );
