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
                this.vcs.logger.exit("Not Authenticated");
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
        this.loginAPI =
            (_a = inputs === null || inputs === void 0 ? void 0 : inputs.CF_LOGIN_API) !== null && _a !== void 0 ? _a : "https://dev.app.algosec.com/api/algosaas/auth/v1/access-keys/login";
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
            if (!tenantId || !clientID || !clientSecret) {
                this.vcs.logger.exit(`Failed to generate token. ${!tenantId ? 'CF_TENANT_ID' : (!clientID ? 'CF_CLIENT_ID' : 'CF_CLIENT_SECRET')} is not available under secrets in GitHub`);
            }
            const headers = {
                "Content-Type": "application/json",
            };
            try {
                this.vcs.logger.debug(`Generate token vs ${loginAPI} with payload ${JSON.stringify(payload)}`);
                const res = yield this.vcs.http.post(loginAPI, JSON.stringify(payload), headers);
                const response_code = res.message.statusCode;
                const data = JSON.parse(yield res.readBody());
                // this.gcpCredsJson ? await this.createGcpCredentials(this.gcpCredsJson) : null
                if (response_code >= 200 && response_code <= 300) {
                    this.vcs.logger.info("Passed authentication vs CF's login. new token has been generated.");
                    return data === null || data === void 0 ? void 0 : data.access_token;
                }
                else {
                    this.vcs.logger.exit(`Failed to generate token, ${data.errorCode == "TENANT_NOT_FOUND"
                        ? "Invalid value in tenantId field"
                        : data.message}`);
                }
            }
            catch (error) {
                const errMsg = JSON.parse(error);
                this.vcs.logger.exit(`Failed to generate token. Error msg: ${(errMsg === null || errMsg === void 0 ? void 0 : errMsg.message) != ""
                    ? errMsg === null || errMsg === void 0 ? void 0 : errMsg.message
                    : (errMsg === null || errMsg === void 0 ? void 0 : errMsg.errorCode) == "TENANT_NOT_FOUND"
                        ? "Invalid value in tenantId field"
                        : error.toString()}`);
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
                if ((responses === null || responses === void 0 ? void 0 : responses.filter((response) => response).length) == 0) {
                    this.vcs.logger.error("No files were uploaded, please check logs");
                }
                else if (responses.some((response) => !response)) {
                    this.vcs.logger.error("Some files failed to upload, please check logs");
                }
                else {
                    this.vcs.logger.info("File/s were uploaded successfully");
                }
            }
            catch (e) {
                this.vcs.logger.error("Some files failed to upload, please check logs");
            }
        });
    }
    uploadFile(file) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let res = false;
            try {
                if (((_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.plan) != "") {
                    const ans = yield this.vcs.uploadAnalysisFile(file, this.jwt);
                    if (ans) {
                        res = true;
                    }
                }
                else {
                    this.vcs.logger.debug(`No plan was created for: ${file.folder}, please check terraform logs`);
                }
            }
            catch (e) {
                this.vcs.logger.error(`File upload for: ${file.folder} failed due to errors:\n ${e}`);
                res = false;
            }
            return res;
        });
    }
    analyze(filesToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            let analysisResults = [];
            try {
                yield this.triggerCodeAnalysis(filesToUpload);
                const codeAnalysisPromises = [];
                filesToUpload === null || filesToUpload === void 0 ? void 0 : filesToUpload.filter((file) => { var _a; return ((_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.plan) != ""; }).forEach((file) => codeAnalysisPromises.push(this.pollCodeAnalysisResponse(file)));
                analysisResults = yield Promise.all(codeAnalysisPromises);
                if (!analysisResults || (analysisResults === null || analysisResults === void 0 ? void 0 : analysisResults.length) == 0) {
                    // this.vcs.logger.error("Analysis failed, please contact support.");
                    analysisResults = [];
                }
                this.vcs.logger.debug(`Risk analysis result:\n${JSON.stringify(analysisResults, null, "\t")}\n`, true);
            }
            catch (e) {
                // this.vcs.logger.error(`Analysis failed, please contact support.\n: ${e}`);
                analysisResults = [];
            }
            return analysisResults;
        });
    }
    pollCodeAnalysisResponse(file) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let analysisResult = yield this.checkCodeAnalysisResponse(file);
            this.vcs.logger.info(`Waiting for risk analysis response for folder: ${file.folder}`);
            for (let i = 0; i < 60; i++) {
                yield this.wait(5000);
                analysisResult = yield this.checkCodeAnalysisResponse(file);
                if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.additions) {
                    analysisResult.folder = file === null || file === void 0 ? void 0 : file.folder;
                    this.vcs.logger.debug(`Response for folder: ${file === null || file === void 0 ? void 0 : file.folder}\n` +
                        JSON.stringify(analysisResult) +
                        "\n", true);
                    break;
                }
            }
            if (!analysisResult) {
                analysisResult = {
                    folder: file === null || file === void 0 ? void 0 : file.folder,
                    error: "Analysis has timed out for folder: " +
                        (file === null || file === void 0 ? void 0 : file.folder) +
                        ", please contact support.",
                    proceeded_file: file === null || file === void 0 ? void 0 : file.uuid,
                    additions: undefined,
                    success: false,
                };
                this.vcs.logger.error("Failed to get analysis result for folder: " +
                    (file === null || file === void 0 ? void 0 : file.folder) +
                    "\n" +
                    (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.error));
            }
            else if (!(analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.success)) {
                analysisResult = {
                    folder: file === null || file === void 0 ? void 0 : file.folder,
                    error: (_a = analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.additions) === null || _a === void 0 ? void 0 : _a.toString(),
                    proceeded_file: file === null || file === void 0 ? void 0 : file.uuid,
                    additions: undefined,
                    success: false,
                };
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
        var _a, _b;
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
                    error: (_b = response === null || response === void 0 ? void 0 : response.message) === null || _b === void 0 ? void 0 : _b.statusMessage,
                    proceeded_file: file === null || file === void 0 ? void 0 : file.uuid,
                    additions: undefined,
                    success: false,
                };
            }
        });
    }
}
exports.AshCodeAnalysis = AshCodeAnalysis;
