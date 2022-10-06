"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionControlService = void 0;
const vcs_model_1 = require("./vcs.model");
class VersionControlService {
    getInstanceByType(type) {
        try {
            return vcs_model_1.VersionControlFactory.getInstance(type);
        }
        catch (e) {
            throw new Error(e);
        }
    }
}
exports.VersionControlService = VersionControlService;
