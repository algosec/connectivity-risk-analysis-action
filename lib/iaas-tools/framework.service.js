"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameworkService = void 0;
const framework_model_1 = require("./framework.model");
class FrameworkService {
    getInstanceByType(type, vcs) {
        return framework_model_1.FrameworkFactory.getInstance(type, vcs);
    }
}
exports.FrameworkService = FrameworkService;
