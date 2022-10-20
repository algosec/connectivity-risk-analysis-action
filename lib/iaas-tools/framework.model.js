"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameworkFactory = exports.frameworkMap = void 0;
const terraform_1 = require("./terraform");
exports.frameworkMap = {
    terraform: terraform_1.Terraform
};
class FrameworkFactory {
    static getInstance(frameworkKey, vcs) {
        try {
            return new exports.frameworkMap[frameworkKey](vcs);
        }
        catch (error) {
            throw new Error("Unsupported framework type: " + frameworkKey);
        }
    }
}
exports.FrameworkFactory = FrameworkFactory;
