"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalysis = void 0;
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const http_client_1 = require("@actions/http-client");
const exec_1 = require("./common/exec");
require("dotenv/config");
const vcs_service_1 = require("./vcs/vcs.service");
const framework_service_1 = require("./iaas-tools/framework.service");
const aws_1 = require("./providers/aws");
const getUuid = require('uuid-by-string');
const uuid = require('uuid');
// import {WebhookPayload} from '@actions/github/lib/interfaces'
// import {githubEventPayloadMock, codeAnalysisMock, terraformPlanFileMock, terraformSinglePlanFileMock} from './mockData'
// context.payload = githubEventPayloadMock as WebhookPayload & any
class CodeAnalysis {
    constructor() {
        var _a, _b, _c, _d, _f, _g, _h, _j;
        this.steps = {};
        this.http = new http_client_1.HttpClient();
        this.debugMode = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.ALGOSEC_DEBUG;
        this.apiUrl = (_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.API_URL;
        this.tenantId = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.TENANT_ID;
        this.clientId = (_d = process === null || process === void 0 ? void 0 : process.env) === null || _d === void 0 ? void 0 : _d.CF_CLIENT_ID;
        this.clientSecret = (_f = process === null || process === void 0 ? void 0 : process.env) === null || _f === void 0 ? void 0 : _f.CF_CLIENT_SECRET;
        this.loginAPI = (_g = process === null || process === void 0 ? void 0 : process.env) === null || _g === void 0 ? void 0 : _g.CF_LOGIN_API;
        this.http = new http_client_1.HttpClient();
        this.frameworkType = (_h = process === null || process === void 0 ? void 0 : process.env) === null || _h === void 0 ? void 0 : _h.FRAMEWORK_TYPE;
        this.vcsType = (_j = process === null || process === void 0 ? void 0 : process.env) === null || _j === void 0 ? void 0 : _j.VCS_TYPE;
        this.framework = new framework_service_1.FrameworkService().getInstanceByType(this.frameworkType);
        this.vcs = new vcs_service_1.VersionControlService().getInstanceByType(this.vcsType);
        this.actionUuid = getUuid(this.vcs.sha);
        this.workDir = this.vcs.workspace + '_' + this.actionUuid;
    }
    auth(tenantId, clientID, clientSecret, loginAPI) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                "tenantId": tenantId,
                "clientId": clientID,
                "clientSecret": clientSecret
            };
            const headers = {
                "Content-Type": "application/json"
            };
            try {
                const res = yield this.http.post(loginAPI, JSON.stringify(payload), headers);
                const response_code = res.message.statusCode;
                const data = JSON.parse(yield res.readBody());
                if (200 <= response_code && response_code <= 300) {
                    (0, core_1.info)('Passed authentication vs CF\'s login. New token has been generated.');
                    return data === null || data === void 0 ? void 0 : data.access_token;
                }
                else {
                    (0, core_1.setFailed)(`Failed to generate token. Error code ${response_code}, msg: ${JSON.stringify(data)}`);
                }
            }
            catch (error) {
                (0, core_1.setFailed)(`Failed to generate token. Error msg: ${error.toString()}`);
            }
            return '';
        });
    }
    prepareRepo() {
        return __awaiter(this, void 0, void 0, function* () {
            this.steps.gitClone = yield (0, exec_1.exec)('git', ['clone', `https://${github_1.context.repo.owner}:${this.vcs.token}@github.com/${github_1.context.repo.owner}/${github_1.context.repo.repo}.git`, this.workDir]);
            process.chdir(this.workDir);
            this.steps.gitFetch = yield (0, exec_1.exec)('git', ['fetch', 'origin', `pull/${github_1.context.payload.pull_request.number.toString()}/head:${this.actionUuid}`]);
            this.steps.gitCheckout = yield (0, exec_1.exec)('git', ['checkout', this.actionUuid]);
        });
    }
    checkForDiff(fileTypes) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let diffFolders;
            try {
                if (((_a = this === null || this === void 0 ? void 0 : this.vcs) === null || _a === void 0 ? void 0 : _a.octokit) && ((_b = github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.payload) === null || _b === void 0 ? void 0 : _b.pull_request)) {
                    const diffs = yield this.vcs.getDiff(this.vcs.octokit);
                    const foldersSet = new Set(diffs
                        .filter(diff => fileTypes.some(fileType => { var _a; return (_a = diff === null || diff === void 0 ? void 0 : diff.filename) === null || _a === void 0 ? void 0 : _a.endsWith(fileType); }))
                        .map(diff => diff === null || diff === void 0 ? void 0 : diff.filename.split('/')[0]));
                    diffFolders = [...foldersSet];
                }
            }
            catch (error) {
                if (error instanceof Error)
                    (0, core_1.setFailed)(error.message);
            }
            if ((diffFolders === null || diffFolders === void 0 ? void 0 : diffFolders.length) == 0) {
                (0, core_1.info)('##### Algosec ##### No changes were found in terraform plans');
                return;
            }
            (0, core_1.info)('##### Algosec ##### Step 1 - Diffs Result: ' + JSON.stringify(diffFolders));
            return diffFolders;
        });
    }
    triggerCodeAnalysis(filesToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileUploadPromises = [];
            filesToUpload.forEach(file => fileUploadPromises.push(this.uploadFile(file)));
            const response = yield Promise.all(fileUploadPromises);
            if (response) {
                (0, core_1.info)('##### Algosec ##### Step 3 - File/s Uploaded Successfully');
            }
        });
    }
    uploadFile(file) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const aws = new aws_1.Aws();
            let res = false;
            if (file === null || file === void 0 ? void 0 : file.output) {
                const ans = yield aws.uploadToS3(file === null || file === void 0 ? void 0 : file.uuid, JSON.stringify((_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.plan), this.jwt);
                if (ans) {
                    res = true;
                }
            }
            return res;
        });
    }
    getCodeAnalysis(filesToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            let analysisResult;
            const codeAnalysisPromises = [];
            filesToUpload.forEach(file => codeAnalysisPromises.push(this.pollCodeAnalysisResponse(file)));
            analysisResult = yield Promise.all(codeAnalysisPromises);
            if (!analysisResult || (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.error)) {
                (0, core_1.setFailed)('##### Algosec ##### Code Analysis failed');
                return;
            }
            (0, core_1.info)('##### Algosec ##### Step 4 - Code Analysis Result: ' + JSON.stringify(analysisResult));
            return analysisResult;
        });
    }
    pollCodeAnalysisResponse(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let analysisResult = yield this.checkCodeAnalysisResponse(file);
            for (let i = 0; i < 50; i++) {
                yield this.wait(3000);
                analysisResult = yield this.checkCodeAnalysisResponse(file);
                if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.additions) {
                    (0, core_1.info)('##### Algosec ##### Response: ' + JSON.stringify(analysisResult));
                    break;
                }
                else if (analysisResult.error) {
                    (0, core_1.setFailed)('##### Algosec ##### Poll Request failed: ' + analysisResult.error);
                    break;
                }
            }
            return analysisResult;
        });
    }
    wait(ms = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                (0, core_1.info)(`waiting for response...`);
                setTimeout(resolve, ms);
            });
        });
    }
    checkCodeAnalysisResponse(file) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const pollUrl = `${this.apiUrl}/message?customer=${github_1.context.repo.owner}&action_id=${file.uuid}`;
            const response = yield this.http.get(pollUrl, { 'Authorization': 'Bearer ' + this.jwt });
            if (((_a = response === null || response === void 0 ? void 0 : response.message) === null || _a === void 0 ? void 0 : _a.statusCode) == 200) {
                const body = yield response.readBody();
                const message = body && body != '' ? JSON.parse(body) : null;
                if (message === null || message === void 0 ? void 0 : message.message_found) {
                    return (message === null || message === void 0 ? void 0 : message.result) ? JSON.parse(message === null || message === void 0 ? void 0 : message.result) : null;
                }
                else {
                    return null;
                }
            }
            else {
                return { error: response.message.statusMessage };
            }
        });
    }
    parseOutput(filesToUpload, analysisResult) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = this.vcs.parseCodeAnalysis(filesToUpload, analysisResult);
            this.steps.comment = this.vcs.createComment(body);
            // this.steps.comment = await exec('gh', ['pr', 'comment', context.payload.pull_request.number.toString(), '-b', commentBody])
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.jwt = yield this.auth(this.tenantId, this.clientId, this.clientSecret, this.loginAPI);
                if (!this.jwt || this.jwt == '') {
                    (0, core_1.setFailed)('##### Algosec ##### Step 0 Failed to generate token');
                    return;
                }
                this.steps.auth = { code: 0, stdout: this.jwt, stderr: '' };
                if (this.debugMode) {
                    yield (0, exec_1.exec)('rimraf', [this.workDir]);
                }
                yield this.prepareRepo();
                const foldersToRunCheck = yield this.checkForDiff(this.framework.fileTypes);
                const filesToUpload = yield this.framework.check(foldersToRunCheck, this.workDir);
                // const filesToUpload = terraformSinglePlanFileMock
                yield this.triggerCodeAnalysis(filesToUpload);
                // const codeAnalysisResponse = codeAnalysisMock as any
                const codeAnalysisResponses = yield this.getCodeAnalysis(filesToUpload);
                yield this.parseOutput(filesToUpload, codeAnalysisResponses);
                if (codeAnalysisResponses.some(response => !(response === null || response === void 0 ? void 0 : response.success))) {
                    let errors = '';
                    // Object.keys(this.steps).forEach(step => errors += this.steps[step].stderr)
                    (0, core_1.setFailed)('##### Algosec ##### The risks analysis process completed with errors:\n' + errors);
                }
                else {
                    (0, core_1.info)('##### Algosec ##### Step 5 - Parsing Code Analysis');
                    if (codeAnalysisResponses.some(response => { var _a; return !((_a = response === null || response === void 0 ? void 0 : response.additions) === null || _a === void 0 ? void 0 : _a.analysis_state); })) {
                        (0, core_1.setFailed)('##### Algosec ##### The risks analysis process completed successfully with risks, please check report');
                    }
                    else {
                        (0, core_1.info)('##### Algosec ##### Step 6 - The risks analysis process completed successfully without any risks');
                        return;
                    }
                }
            }
            catch (_e) {
                (0, core_1.error)(_e);
            }
        });
    }
}
exports.CodeAnalysis = CodeAnalysis;
const codeAnalyzer = new CodeAnalysis();
codeAnalyzer.run();
