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
exports.AshCodeAnalysis = void 0;
require("dotenv/config");
const fs_1 = require("fs");
class AshCodeAnalysis {
    constructor(vcs) {
        this.vcs = vcs;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setSecrets();
            this.jwt = yield this.auth(this.tenantId, this.clientId, this.clientSecret, this.loginAPI);
            if (!this.jwt || this.jwt == "") {
                this.vcs.logger.exit("- ##### IAC Connectivity Risk Analysis ##### Not Authenticated");
                return false;
            }
            this.vcs.steps.auth = { exitCode: 0, stdout: this.jwt, stderr: "" };
            return true;
        });
    }
    setSecrets() {
        var _a, _b;
        const inputs = this.vcs.getInputs();
        this.debugMode = (inputs === null || inputs === void 0 ? void 0 : inputs.ALGOSEC_DEBUG) == "true";
        this.apiUrl = this.vcs.cfApiUrl;
        this.loginAPI = (_a = inputs === null || inputs === void 0 ? void 0 : inputs.CF_LOGIN_API) !== null && _a !== void 0 ? _a : "https://dev.app.algosec.com/api/algosaas/auth/v1/access-keys/login";
        this.tenantId = inputs === null || inputs === void 0 ? void 0 : inputs.CF_TENANT_ID;
        this.clientId = inputs === null || inputs === void 0 ? void 0 : inputs.CF_CLIENT_ID;
        this.clientSecret = inputs === null || inputs === void 0 ? void 0 : inputs.CF_CLIENT_SECRET;
        this.gcpCredsJson = (_b = inputs === null || inputs === void 0 ? void 0 : inputs.GOOGLE_CREDENTIALS) !== null && _b !== void 0 ? _b : "";
    }
    auth(tenantId, clientID, clientSecret, loginAPI) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                tenantId,
                clientId: clientID,
                clientSecret,
            };
            const headers = {
                "Content-Type": "application/json",
            };
            try {
                const res = yield this.vcs.http.post(loginAPI, JSON.stringify(payload), headers);
                const response_code = res.message.statusCode;
                const data = JSON.parse(yield res.readBody());
                this.gcpCredsJson ? yield this.createGcpCredentials(this.gcpCredsJson) : null;
                if (response_code >= 200 && response_code <= 300) {
                    this.vcs.logger.info("- ##### IAC Connectivity Risk Analysis ##### Passed authentication vs CF's login. new token has been generated.");
                    return data === null || data === void 0 ? void 0 : data.access_token;
                }
                else {
                    this.vcs.logger.exit(`- ##### IAC Connectivity Risk Analysis ##### Failed to generate token.\n Error code ${response_code}, msg: ${JSON.stringify(data, null, "\t")}`);
                }
            }
            catch (error) {
                this.vcs.logger.exit(`- ##### IAC Connectivity Risk Analysis ##### Failed to generate token. Error msg: ${error.toString()}`);
            }
            return "";
        });
    }
    createGcpCredentials(gcpCredsString) {
        return __awaiter(this, void 0, void 0, function* () {
            // const gcpCreds = JSON.parse(gcpCredsString)
            const credentialsFilePath = `${this.vcs.workDir}/gcp_auth.json`;
            try {
                (0, fs_1.writeFileSync)(credentialsFilePath, gcpCredsString);
                process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsFilePath;
            }
            catch (e) {
                this.vcs.logger.error("Creating GCP Credentials failed: " + e);
            }
        });
    }
    triggerCodeAnalysis(filesToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileUploadPromises = [];
                filesToUpload.forEach((file) => fileUploadPromises.push(this.uploadFile(file)));
                const responses = yield Promise.all(fileUploadPromises);
                if (responses.filter(response => response).length == 0) {
                    this.vcs.logger.exit("- ##### IAC Connectivity Risk Analysis ##### No files were uploaded, please check logs");
                }
                else if (responses.some(response => !response)) {
                    this.vcs.logger.error("- ##### IAC Connectivity Risk Analysis ##### Some files failed to upload, please check logs");
                }
                else {
                    this.vcs.logger.info("- ##### IAC Connectivity Risk Analysis ##### File/s were uploaded successfully");
                }
            }
            catch (e) {
                this.vcs.steps.upload = { exitCode: 0, stdout: '', stderr: "- ##### IAC Connectivity Risk Analysis ##### Upload Failure: " + e };
                this.vcs.logger.error("- ##### IAC Connectivity Risk Analysis ##### Some files failed to upload, please check logs");
            }
        });
    }
    uploadFile(file) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = false;
            try {
                if (((_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.plan) != '') {
                    const ans = yield this.vcs.uploadAnalysisFile(file, this.jwt);
                    if (ans) {
                        res = true;
                    }
                }
                else {
                    this.vcs.logger.info(`- ##### IAC Connectivity Risk Analysis ##### No plan was created for: ${file.folder}, please check terraform logs`);
                }
            }
            catch (e) {
                this.vcs.logger.error(`- ##### IAC Connectivity Risk Analysis ##### File upload for: ${file.folder} failed due to errors:\n ${e}`);
                res = false;
            }
            return res;
        });
    }
    analyze(filesToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            let analysisResult = [];
            try {
                yield this.triggerCodeAnalysis(filesToUpload);
                const codeAnalysisPromises = [];
                filesToUpload
                    .filter((file) => { var _a; return ((_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.plan) != ''; })
                    .forEach((file) => codeAnalysisPromises.push(this.pollCodeAnalysisResponse(file)));
                analysisResult = yield Promise.all(codeAnalysisPromises);
                if (!analysisResult || (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.length) == 0) {
                    this.vcs.steps.analysis = { exitCode: 0, stdout: '', stderr: "- ##### IAC Connectivity Risk Analysis ##### Analysis failed, please contact support." };
                    this.vcs.logger.exit("- ##### IAC Connectivity Risk Analysis ##### Code Analysis failed");
                    analysisResult = [];
                }
                this.vcs.logger.debug(`::group::##### IAC Connectivity Risk Analysis ##### Risk analysis result:\n${JSON.stringify(analysisResult, null, "\t")}\n::endgroup::`);
            }
            catch (e) {
                this.vcs.steps.analysis = { exitCode: 0, stdout: '', stderr: "- ##### IAC Connectivity Risk Analysis ##### Analysis failed, please contact support.\n" + e };
                this.vcs.logger.exit(`- ##### IAC Connectivity Risk Analysis ##### Code Analysis failed due to errors: ${e}`);
                analysisResult = [];
            }
            return analysisResult;
        });
    }
    pollCodeAnalysisResponse(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let analysisResult = yield this.checkCodeAnalysisResponse(file);
            this.vcs.logger.info(`- ##### IAC Connectivity Risk Analysis ##### Waiting for risk analysis response for folder: ${file.folder}`);
            for (let i = 0; i < 60; i++) {
                yield this.wait(5000);
                analysisResult = yield this.checkCodeAnalysisResponse(file);
                if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.additions) {
                    analysisResult.folder = file === null || file === void 0 ? void 0 : file.folder;
                    this.vcs.logger.debug("::group::##### IAC Connectivity Risk Analysis ##### Response:\n" + JSON.stringify(analysisResult) + "\n::endgroup::");
                    break;
                }
                else if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.error) {
                    this.vcs.logger.error("- ##### IAC Connectivity Risk Analysis ##### Poll Request failed for folder: " + (file === null || file === void 0 ? void 0 : file.folder) + (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.error));
                    break;
                }
            }
            if (!analysisResult) {
                this.vcs.logger.error("- ##### IAC Connectivity Risk Analysis ##### Poll Request has timed out for folder: " + (file === null || file === void 0 ? void 0 : file.folder));
            }
            return analysisResult;
        });
    }
    wait(ms = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve) => {
                setTimeout(resolve, ms);
            });
        });
    }
    checkCodeAnalysisResponse(file) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const pollUrl = `${this.apiUrl}/analysis_result?customer=${this.vcs.repo.owner}&action_id=${file.uuid}`;
            const response = yield this.vcs.http.get(pollUrl, {
                Authorization: "Bearer " + this.jwt,
            });
            if (((_a = response === null || response === void 0 ? void 0 : response.message) === null || _a === void 0 ? void 0 : _a.statusCode) == 200) {
                const body = yield response.readBody();
                const message = body && body != "" ? JSON.parse(body) : null;
                if (message === null || message === void 0 ? void 0 : message.message_found) {
                    const result = (message === null || message === void 0 ? void 0 : message.result) ? JSON.parse(message === null || message === void 0 ? void 0 : message.result) : null;
                    return result;
                }
                else {
                    return null;
                }
            }
            else {
                return {
                    error: response.message.statusMessage,
                    proceeded_file: "",
                    additions: { analysis_result: [], analysis_state: false },
                    success: false,
                };
            }
        });
    }
}
exports.AshCodeAnalysis = AshCodeAnalysis;
