"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionControlFactory = exports.versionControlMap = exports.GitLab = void 0;
const github_1 = require("./github");
class GitLab {
    constructor() {
        var _a, _b, _c;
        this.workspace = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.GITLAB_WORKSPACE;
        this.token = (_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.GITLAB_TOKEN;
        this.sha = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITLAB_SHA;
    }
    getInputs() { }
    getDiff(client) {
    }
    createComment(options) {
    }
    parseCodeAnalysis(analysis, VersionControl) {
    }
    getRepoRemoteUrl() {
        return '';
    }
    checkForDiffByFileTypes(fileTypes) {
    }
    parseOutput(filesToUpload, analysisResult) { }
    uploadAnalysisFile(file, jwt) { }
}
exports.GitLab = GitLab;
exports.versionControlMap = {
    github: github_1.Github,
    gitlab: GitLab
};
class VersionControlFactory {
    static getInstance(versionControlKey) {
        return new exports.versionControlMap[versionControlKey]();
    }
}
exports.VersionControlFactory = VersionControlFactory;
// const terraform = VersionControlFactory.getInstance("terraform");
// const cloudformation = VersionControlFactory.getInstance("cloudformation");
// console.log(
//   "IaS versionControl type: ",
//   new VersionControlService().getInstanceByType("cloudformation")
// );
// console.log(
//     "IaS versionControl type: ",
//     new VersionControlService().getInstanceByType("terraform")
//   );
