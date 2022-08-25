"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameworkFactory = exports.frameworkMap = exports.CloudFormation = void 0;
const terraform_1 = require("./terraform");
class CloudFormation {
    constructor(vcs) {
        this.vcs = vcs;
        this.type = "cloudformation";
        this.fileTypes = ["json", "yaml"];
    }
    check(foldersToRunCheck, workDir) { }
}
exports.CloudFormation = CloudFormation;
exports.frameworkMap = {
    terraform: terraform_1.Terraform,
    cloudformation: CloudFormation,
};
class FrameworkFactory {
    static getInstance(frameworkKey, vcs) {
        return new exports.frameworkMap[frameworkKey](vcs);
    }
}
exports.FrameworkFactory = FrameworkFactory;
