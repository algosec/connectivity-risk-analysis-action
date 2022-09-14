"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionControlFactory = exports.versionControlMap = exports.GitLab = void 0;
const github_1 = require("./github");
class GitLab {
    constructor() {
        var _a, _b, _c, _d, _e, _f;
        this.workspace = (_b = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.GITLAB_WORKSPACE) !== null && _b !== void 0 ? _b : "";
        this.token = (_d = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITLAB_TOKEN) !== null && _d !== void 0 ? _d : "";
        this.sha = (_f = (_e = process === null || process === void 0 ? void 0 : process.env) === null || _e === void 0 ? void 0 : _e.GITLAB_SHA) !== null && _f !== void 0 ? _f : "";
    }
    getInputs() { }
    getDiff(client) { }
    createComment(options) { }
    parseCodeAnalysis(analysis, VersionControl) { }
    getRepoRemoteUrl() {
        return "";
    }
    checkForDiffByFileTypes(fileTypes) { }
    parseOutput(filesToUpload, analysisResult) { }
    uploadAnalysisFile(file, jwt) { }
}
exports.GitLab = GitLab;
exports.versionControlMap = {
    github: github_1.Github,
    gitlab: GitLab,
};
class VersionControlFactory {
    static getInstance(versionControlKey) {
        return new exports.versionControlMap[versionControlKey]();
    }
}
exports.VersionControlFactory = VersionControlFactory;
