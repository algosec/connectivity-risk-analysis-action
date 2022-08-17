"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionControlService = void 0;
const vcs_model_1 = require("./vcs.model");
class VersionControlService {
    getInstanceByType(type) {
        return vcs_model_1.VersionControlFactory.getInstance(type);
    }
}
exports.VersionControlService = VersionControlService;
