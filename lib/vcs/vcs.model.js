"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionControlFactory = exports.versionControlMap = void 0;
const github_1 = require("./github");
exports.versionControlMap = {
    github: github_1.Github
};
class VersionControlFactory {
    static getInstance(versionControlKey) {
        return new exports.versionControlMap[versionControlKey]();
    }
}
exports.VersionControlFactory = VersionControlFactory;
