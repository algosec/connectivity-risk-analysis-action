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
class AshCodeAnalysis {
    constructor(vcs) {
        this.vcs = vcs;
        this.steps = {};
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setSecrets();
            this.jwt = yield this.auth(this.tenantId, this.clientId, this.clientSecret, this.loginAPI);
            if (!this.jwt || this.jwt == "") {
                this.vcs.logger.exit("##### IAC Connectivity Risk Analysis ##### Not Authenticated");
                return;
            }
            this.steps.auth = { exitCode: 0, stdout: this.jwt, stderr: "" };
        });
    }
    setSecrets() {
        var _a;
        const inputs = this.vcs.getInputs();
        this.debugMode = (inputs === null || inputs === void 0 ? void 0 : inputs.ALGOSEC_DEBUG) == "true";
        this.apiUrl = inputs === null || inputs === void 0 ? void 0 : inputs.CF_API_URL;
        this.loginAPI = (_a = inputs === null || inputs === void 0 ? void 0 : inputs.CF_LOGIN_API) !== null && _a !== void 0 ? _a : "";
        this.tenantId = inputs === null || inputs === void 0 ? void 0 : inputs.CF_TENANT_ID;
        this.clientId = inputs === null || inputs === void 0 ? void 0 : inputs.CF_CLIENT_ID;
        this.clientSecret = inputs === null || inputs === void 0 ? void 0 : inputs.CF_CLIENT_SECRET;
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
                if (response_code >= 200 && response_code <= 300) {
                    this.vcs.logger.info("##### IAC Connectivity Risk Analysis ##### Step 1: passed authentication vs CF's login. new token has been generated.");
                    return data === null || data === void 0 ? void 0 : data.access_token;
                }
                else {
                    this.vcs.logger.exit(`##### IAC Connectivity Risk Analysis ##### Failed to generate token. Error code ${response_code}, msg: ${JSON.stringify(data)}`);
                }
            }
            catch (error) {
                this.vcs.logger.exit(`##### IAC Connectivity Risk Analysis ##### Failed to generate token. Error msg: ${error.toString()}`);
            }
            return "";
        });
    }
    triggerCodeAnalysis(filesToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileUploadPromises = [];
            filesToUpload.forEach((file) => fileUploadPromises.push(this.uploadFile(file)));
            const response = yield Promise.all(fileUploadPromises);
            if (response) {
                this.vcs.logger.info("##### IAC Connectivity Risk Analysis ##### Step 4 - file/s uploaded successfully");
            }
        });
    }
    uploadFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = false;
            try {
                if (file === null || file === void 0 ? void 0 : file.output) {
                    const ans = yield this.vcs.uploadAnalysisFile(file, this.jwt);
                    if (ans) {
                        res = true;
                    }
                }
            }
            catch (e) {
                res = false;
            }
            return res;
        });
    }
    analyze(filesToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            let analysisResult;
            yield this.triggerCodeAnalysis(filesToUpload);
            const codeAnalysisPromises = [];
            filesToUpload
                .filter((file) => { var _a; return (_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.plan; })
                .forEach((file) => codeAnalysisPromises.push(this.pollCodeAnalysisResponse(file)));
            analysisResult = yield Promise.all(codeAnalysisPromises);
            if (!analysisResult || (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.error)) {
                this.vcs.logger.exit("##### IAC Connectivity Risk Analysis ##### Code Analysis failed");
                return [];
            }
            this.vcs.logger.info("##### IAC Connectivity Risk Analysis ##### code analysis result: " +
                JSON.stringify(analysisResult));
            return analysisResult;
        });
    }
    pollCodeAnalysisResponse(file) {
        return __awaiter(this, void 0, void 0, function* () {
            this.vcs.logger.info("##### IAC Connectivity Risk Analysis ##### Step 5 - waiting for response...");
            let analysisResult = yield this.checkCodeAnalysisResponse(file);
            for (let i = 0; i < 50; i++) {
                yield this.wait(3000);
                analysisResult = yield this.checkCodeAnalysisResponse(file);
                if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.additions) {
                    analysisResult.folder = file === null || file === void 0 ? void 0 : file.folder;
                    this.vcs.logger.info("##### IAC Connectivity Risk Analysis ##### Response: " + JSON.stringify(analysisResult));
                    break;
                }
                else if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.error) {
                    this.vcs.logger.exit("##### IAC Connectivity Risk Analysis ##### Poll Request failed: " + (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.error));
                    break;
                }
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
            const pollUrl = `${this.apiUrl}/message?customer=${this.vcs.repo.owner}&action_id=${file.uuid}`;
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
