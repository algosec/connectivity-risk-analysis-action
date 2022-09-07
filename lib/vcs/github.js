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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Github = void 0;
const github_1 = require("@actions/github");
const core_1 = require("@actions/core");
const http_client_1 = require("@actions/http-client");
const exec_1 = require("@actions/exec");
const exec_2 = require("../common/exec");
const risk_model_1 = require("../common/risk.model");
const uuid_by_string_1 = __importDefault(require("uuid-by-string"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// DEBUG LOCALLY
// import {githubEventPayloadMock } from "../../test/mockData.azure"
// context.payload = githubEventPayloadMock as WebhookPayload & any
class Github {
    constructor() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
        this.steps = {};
        this.useCheckoutAction = false;
        this.firstRun = false;
        this.firstRun = ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.FIRST_RUN) == 'true';
        this.stopWhenFail = ((_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.STOP_WHEN_FAIL) == 'true';
        this.http = new http_client_1.HttpClient();
        this.logger = { debug: core_1.debug, error: core_1.error, exit: core_1.setFailed, info: core_1.info };
        this.workspace = (_d = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITHUB_WORKSPACE) !== null && _d !== void 0 ? _d : "";
        this.token = (_f = (_e = process === null || process === void 0 ? void 0 : process.env) === null || _e === void 0 ? void 0 : _e.GITHUB_TOKEN) !== null && _f !== void 0 ? _f : "";
        this.sha = (_h = (_g = process === null || process === void 0 ? void 0 : process.env) === null || _g === void 0 ? void 0 : _g.GITHUB_SHA) !== null && _h !== void 0 ? _h : "";
        this._context = github_1.context;
        this.octokit = (0, github_1.getOctokit)(this.token);
        this.payload = (_j = this._context) === null || _j === void 0 ? void 0 : _j.payload;
        this.repo = this._context.repo;
        this.pullRequest = (_o = (_m = (_l = (_k = this._context) === null || _k === void 0 ? void 0 : _k.payload) === null || _l === void 0 ? void 0 : _l.pull_request) === null || _m === void 0 ? void 0 : _m.number) === null || _o === void 0 ? void 0 : _o.toString();
        this.useCheckoutAction = (((_p = process === null || process === void 0 ? void 0 : process.env) === null || _p === void 0 ? void 0 : _p.USE_CHECKOUT) && ((_q = process === null || process === void 0 ? void 0 : process.env) === null || _q === void 0 ? void 0 : _q.USE_CHECKOUT) != 'false') || ((_r = process === null || process === void 0 ? void 0 : process.env) === null || _r === void 0 ? void 0 : _r.USE_CHECKOUT) == 'true' ? true : false;
        this.workDir = this.useCheckoutAction ? this.workspace : this.workspace + "_ALGOSEC_CODE_ANALYSIS";
        this.actionUuid = (0, uuid_by_string_1.default)(this.sha);
        this.assetsUrl =
            "https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons";
        this.cfApiUrl = (_t = (_s = process === null || process === void 0 ? void 0 : process.env) === null || _s === void 0 ? void 0 : _s.CF_API_URL) !== null && _t !== void 0 ? _t : "https://api-feature-cs-0015342.dev.cloudflow.algosec.com/cloudflow/api/devsecops/v1";
    }
    getDiff(octokit) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield octokit.rest.repos.compareCommits({
                base: (_c = (_b = (_a = this._context) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.pull_request) === null || _c === void 0 ? void 0 : _c.base.sha,
                head: (_f = (_e = (_d = this._context) === null || _d === void 0 ? void 0 : _d.payload) === null || _e === void 0 ? void 0 : _e.pull_request) === null || _f === void 0 ? void 0 : _f.head.sha,
                owner: this._context.repo.owner,
                per_page: 100,
                repo: this._context.repo.repo,
            });
            const answer = (_h = (_g = result === null || result === void 0 ? void 0 : result.data) === null || _g === void 0 ? void 0 : _g.files) !== null && _h !== void 0 ? _h : [];
            return answer;
        });
    }
    flatten(lists) {
        return lists.reduce((a, b) => a.concat(b), []);
    }
    getDirectories(srcpath) {
        return (0, fs_1.readdirSync)(srcpath)
            .map(file => path_1.default.join(srcpath, file))
            .filter(path => (0, fs_1.statSync)(path).isDirectory());
    }
    getDirectoriesRecursive(srcpath) {
        return [srcpath, ...this.flatten(this.getDirectories(srcpath).map(this.getDirectoriesRecursive))];
    }
    hasFileType(dir, fileTypes) {
        const files = (0, fs_1.readdirSync)(dir);
        if (files.some(file => fileTypes.some(type => file.endsWith(type)))) {
            return true;
        }
        else {
            return false;
        }
    }
    createComment(body) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.octokit.rest.issues.createComment(Object.assign(Object.assign({}, this._context.repo), { issue_number: this._context.issue.number, body }));
            return {
                exitCode: ((_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.body) ? 0 : 1,
                stdout: ((_b = result === null || result === void 0 ? void 0 : result.data) === null || _b === void 0 ? void 0 : _b.body) ? (_c = result === null || result === void 0 ? void 0 : result.data) === null || _c === void 0 ? void 0 : _c.body : null,
                stderr: ((_d = result === null || result === void 0 ? void 0 : result.data) === null || _d === void 0 ? void 0 : _d.body) ? null : (_e = result === null || result === void 0 ? void 0 : result.data) === null || _e === void 0 ? void 0 : _e.body,
            };
        });
    }
    getRepoRemoteUrl() {
        return `https://${this.repo.owner}:${this.token}@github.com/${this.repo.owner}/${this.repo.repo}.git`;
    }
    fetch(additionalGitOptions = []) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing 'git fetch' for branch '${additionalGitOptions}' with token and options `);
            const args = ["fetch", ...additionalGitOptions];
            return yield this.cmd(args);
        });
    }
    clone(baseDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing 'git clone' to directory '${baseDirectory}' with token and options `);
            const remote = this.getRepoRemoteUrl();
            const args = ["clone", remote, baseDirectory];
            return yield this.cmd(args);
        });
    }
    checkout(ghRef, additionalGitOptions = [], ...options) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing 'git checkout' to ref '${ghRef}' with token and options '${options.join(" ")}'`);
            const args = ["checkout", ghRef];
            // if (options.length > 0) {
            //     args = args.concat(options);
            // }
            return yield this.cmd(args);
        });
    }
    cmd(additionalGitOptions, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing Git: ${args.join(" ")}`);
            const res = yield this.capture("git", additionalGitOptions);
            if (res.exitCode !== 0) {
                throw new Error(`Command 'git ${args.join(" ")}' failed: ${JSON.stringify(res)}`);
            }
            return res;
        });
    }
    capture(cmd, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = {
                stdout: "",
                stderr: "",
                exitCode: 0,
            };
            try {
                const code = yield (0, exec_1.exec)(cmd, args, {
                    listeners: {
                        stdout(data) {
                            res.stdout += data.toString();
                        },
                        stderr(data) {
                            res.stderr += data.toString();
                        },
                    },
                });
                res.exitCode = code;
                return res;
            }
            catch (err) {
                const msg = `Command '${cmd}' failed with args '${args.join(" ")}': ${res.stderr}: ${err}`;
                (0, core_1.debug)(`@actions/exec.exec() threw an error: ${msg}`);
                throw new Error(msg);
            }
        });
    }
    prepareRepo() {
        return __awaiter(this, void 0, void 0, function* () {
            this.steps.gitClone = yield this.clone(this.workDir); // await exec('git' , ['clone', this.getRepoRemoteUrl(), this.workDir])
            process.chdir(this.workDir);
            this.steps.gitFetch = yield this.fetch([
                "origin",
                `pull/${this.pullRequest}/head:${this.actionUuid}`,
            ]); // await exec('git' , ['fetch', 'origin', `pull/${this.pullRequest}/head:${this.actionUuid}`])
            this.steps.gitCheckout = yield this.checkout(this.actionUuid); // await exec('git' , ['checkout', this.actionUuid])
        });
    }
    checkForDiffByFileTypes(fileTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.useCheckoutAction) {
                yield this.prepareRepo();
            }
            let diffFolders = [];
            try {
                if (this.firstRun) {
                    const allFolders = yield this.getDirectoriesRecursive(this.workDir);
                    diffFolders = allFolders.filter(folder => this.hasFileType(folder, fileTypes));
                }
                else {
                    const diffs = yield this.getDiff(this.octokit);
                    const foldersSet = new Set(diffs
                        .filter((diff) => fileTypes === null || fileTypes === void 0 ? void 0 : fileTypes.some((fileType) => { var _a; return (_a = diff === null || diff === void 0 ? void 0 : diff.filename) === null || _a === void 0 ? void 0 : _a.endsWith(fileType); }))
                        .map((diff) => diff === null || diff === void 0 ? void 0 : diff.filename.split("/")[0]));
                    diffFolders = [...foldersSet];
                }
            }
            catch (error) {
                if (error instanceof Error)
                    this.logger.exit(error === null || error === void 0 ? void 0 : error.message);
            }
            if ((diffFolders === null || diffFolders === void 0 ? void 0 : diffFolders.length) == 0) {
                this.logger.info("- ##### IAC Connectivity Risk Analysis ##### No changes were found");
                return [];
            }
            this.logger.info(`- ##### IAC Connectivity Risk Analysis ##### Found changes in folders ${diffFolders.join(', ')}`);
            return diffFolders;
        });
    }
    getInputs() {
        return process.env;
    }
    uploadAnalysisFile(file, jwt) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const http = new http_client_1.HttpClient();
                const body = (_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.plan;
                const getPresignedUrl = `${this.cfApiUrl}/presignedurl?actionId=${file === null || file === void 0 ? void 0 : file.uuid}&owner=${(_b = github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.repo) === null || _b === void 0 ? void 0 : _b.owner}&folder=${file === null || file === void 0 ? void 0 : file.folder}`;
                const presignedUrlResponse = yield (yield http.get(getPresignedUrl, { Authorization: `Bearer ${jwt}` })).readBody();
                const presignedUrl = JSON.parse(presignedUrlResponse).presignedUrl;
                const response = yield (yield http.put(presignedUrl, body, { "Content-Type": "application/json" })).readBody();
                if (response == "") {
                    return true;
                }
                else {
                    (0, core_1.setFailed)(response);
                    return false;
                }
            }
            catch (e) {
                console.log(`::group::##### IAC Connectivity Risk Analysis ##### Upload file failed due to errors:\n${e}\n::endgroup::`);
                return false;
            }
        });
    }
    parseOutput(filesToUpload, analysisResults) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = this.parseCodeAnalysis(filesToUpload, analysisResults);
            if (body && body != "")
                this.steps.comment = yield this.createComment(body);
            if (analysisResults === null || analysisResults === void 0 ? void 0 : analysisResults.some((response) => !(response === null || response === void 0 ? void 0 : response.success))) {
                let errors = "";
                Object.keys(this.steps).forEach(step => { var _a, _b; return errors += ((_a = this === null || this === void 0 ? void 0 : this.steps[step]) === null || _a === void 0 ? void 0 : _a.stderr) != '' ? (_b = this === null || this === void 0 ? void 0 : this.steps[step]) === null || _b === void 0 ? void 0 : _b.stderr : ''; });
                this.logger.exit("- ##### IAC Connectivity Risk Analysis ##### The risks analysis process failed.\n" + errors);
            }
            else {
                this.logger.info("- ##### IAC Connectivity Risk Analysis ##### Creating Risks Report");
                if (analysisResults === null || analysisResults === void 0 ? void 0 : analysisResults.some((response) => { var _a, _b; return ((_b = (_a = response === null || response === void 0 ? void 0 : response.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; })) {
                    if (this.stopWhenFail)
                        this.logger.exit("- ##### IAC Connectivity Risk Analysis ##### The risks analysis process completed successfully with risks, please check report");
                    else
                        this.logger.info("- ##### IAC Connectivity Risk Analysis ##### The risks analysis process completed successfully with risks, please check report");
                }
                else {
                    this.logger.info("- ##### IAC Connectivity Risk Analysis ##### Analysis process completed successfully without any risks");
                }
            }
        });
    }
    buildCommentAnalysisBody(analysis, file) {
        var _a;
        let analysisBody = "";
        if (!(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result)) {
            analysisBody = `<details>\n<summary><sub><sub><sub><img height="20" width="20" src="${this.assetsUrl}/failure.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${file.folder}</b></h3></summary>\n${this.buildCommentFrameworkResult(file)}\n</details>`;
        }
        else if (((_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.length) == 0) {
            analysisBody = `<details>\n<summary><sub><sub><sub><img height="20" width="20" src="${this.assetsUrl}/success.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${file.folder}</b></h3></summary>\n${this.buildCommentFrameworkResult(file)}\n</details>`;
        }
        else {
            analysisBody = `<details>\n${this.buildCommentReportResult(analysis, file)}\n${this.buildCommentFrameworkResult(file)}\n</details>`;
        }
        return analysisBody;
    }
    buildCommentReportResult(analysis, file) {
        var _a, _b;
        let risksList = "";
        const CODE_BLOCK = "```";
        analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result.sort((a, b) => parseInt(risk_model_1.severityOrder[a.riskSeverity]) -
            parseInt(risk_model_1.severityOrder[b.riskSeverity])).forEach((risk) => {
            risksList += `<details>\n
<summary><img width="10" height="10" src="${this.assetsUrl}/${risk.riskSeverity}.svg" />  ${risk.riskId}</summary> \n
### **Title:**\n${risk.riskTitle}\n
### **Description:**\n${risk.riskDescription}\n
### **Recommendation:**\n${risk.riskRecommendation.toString()}\n
### **Details:**\n
${CODE_BLOCK}\n
${JSON.stringify(risk.items, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`;
        });
        const severityCount = `<div  align="right">${(0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "critical") > 0
            ? `<img width="10" height="10" src="${this.assetsUrl}/critical.svg" />&nbsp;` +
                (0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "critical") +
                "&nbsp;Critical"
            : ""}${(0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "high") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/high.svg" />&nbsp;` +
                (0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "high") +
                "&nbsp;High"
            : ""}${(0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "medium") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/medium.svg" />&nbsp;` +
                (0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "medium") +
                "&nbsp;Medium"
            : ""}${(0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "low") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/low.svg" />&nbsp;` +
                (0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "low") +
                "&nbsp;Low"
            : ""}</div>`;
        const codeAnalysisContent = `<summary><sub><sub><sub><img height="20" width="20" src="${this.assetsUrl}/warning.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${file.folder +
            (((_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.length) == 0 ? "- No Risks Found" : "")}</b></h3>${((_b = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0 ? severityCount : ""}</summary>\n${risksList}\n`;
        return codeAnalysisContent;
    }
    buildCommentFrameworkResult(file) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const CODE_BLOCK = "```";
        const errors = `Errors\n
${CODE_BLOCK}\n
${(_c = (_b = (_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.log) === null || _b === void 0 ? void 0 : _b.stderr) !== null && _c !== void 0 ? _c : (_e = (_d = file === null || file === void 0 ? void 0 : file.output) === null || _d === void 0 ? void 0 : _d.initLog) === null || _e === void 0 ? void 0 : _e.stderr}\n
${CODE_BLOCK}\n`;
        const output = `Output\n
${CODE_BLOCK}\n
${(_g = (_f = file === null || file === void 0 ? void 0 : file.output) === null || _f === void 0 ? void 0 : _f.log) === null || _g === void 0 ? void 0 : _g.stdout}\n
${CODE_BLOCK}\n`;
        const frameworkContent = `\n<details>
<summary>Terraform Log</summary>
${((_j = (_h = file === null || file === void 0 ? void 0 : file.output) === null || _h === void 0 ? void 0 : _h.log) === null || _j === void 0 ? void 0 : _j.stdout) ? "<br>" + output + "<br>" : ""}
${((_l = (_k = file === null || file === void 0 ? void 0 : file.output) === null || _k === void 0 ? void 0 : _k.log) === null || _l === void 0 ? void 0 : _l.stderr) ? "<br>" + errors + "<br>" : ""}
</details> <!-- End Format Logs -->\n`;
        return frameworkContent;
    }
    buildCommentSummary(filesToUpload, results) {
        let risksTableContents = "";
        const riskArrays = results
            .filter((result) => { var _a, _b; return ((_b = (_a = result === null || result === void 0 ? void 0 : result.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; })
            .map((result) => {
            var _a, _b;
            const folder = (_a = filesToUpload.find((file) => { var _a; return (_a = result === null || result === void 0 ? void 0 : result.proceeded_file) === null || _a === void 0 ? void 0 : _a.includes(file.uuid); })) === null || _a === void 0 ? void 0 : _a.folder;
            return (_b = result === null || result === void 0 ? void 0 : result.additions) === null || _b === void 0 ? void 0 : _b.analysis_result.map((risk) => {
                return {
                    folder,
                    riskId: risk.riskId,
                    riskTitle: risk.riskTitle,
                    riskSeverity: risk.riskSeverity,
                    vendor: risk === null || risk === void 0 ? void 0 : risk.items[0].vendor
                };
            });
        });
        const mergedRisks = [].concat
            .apply([], riskArrays)
            .sort((a, b) => parseInt(risk_model_1.severityOrder[a.riskSeverity]) -
            parseInt(risk_model_1.severityOrder[b.riskSeverity]));
        const groupedRisksById = mergedRisks.reduce((accumulator, item) => {
            if (accumulator[item.riskId]) {
                const group = accumulator[item.riskId];
                if (Array.isArray(group.folder)) {
                    group.folder.push(item.folder);
                }
                else {
                    group.folder = [group.folder, item.folder];
                }
            }
            else {
                accumulator[item.riskId] = item;
            }
            return accumulator;
        }, {});
        Object.values(groupedRisksById).forEach((risk) => {
            var _a;
            risksTableContents += `<tr>\n
<td>${risk.riskId}</td>\n
<td align="center"><img width="10" height="10" src="${this.assetsUrl}/${risk.riskSeverity}.svg" /></td>\n
<td align="center"><sub><img width="24" height="24" src="${this.assetsUrl}/${(_a = risk === null || risk === void 0 ? void 0 : risk.vendor.toLowerCase()) !== null && _a !== void 0 ? _a : "aws"}.svg" /></sub></td>\n
<td>${Array.isArray(risk.folder) ? risk.folder.join(", ") : risk.folder}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`;
        });
        const risksSummary = `
\n
<div align="right">${(0, exec_2.count)(mergedRisks, "riskSeverity", "critical") > 0
            ? `<img width="10" height="10" src="${this.assetsUrl}/critical.svg" />&nbsp;` +
                (0, exec_2.count)(mergedRisks, "riskSeverity", "critical") +
                "&nbsp;Critical"
            : ""}${(0, exec_2.count)(mergedRisks, "riskSeverity", "high") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/high.svg" />&nbsp;` +
                (0, exec_2.count)(mergedRisks, "riskSeverity", "high") +
                "&nbsp;High"
            : ""}${(0, exec_2.count)(mergedRisks, "riskSeverity", "medium") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/medium.svg" />&nbsp;` +
                (0, exec_2.count)(mergedRisks, "riskSeverity", "medium") +
                "&nbsp;Medium"
            : ""}${(0, exec_2.count)(mergedRisks, "riskSeverity", "low") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/low.svg" />&nbsp;` +
                (0, exec_2.count)(mergedRisks, "riskSeverity", "low") +
                "&nbsp;Low"
            : ""}</div><br>
\n`;
        const risksTable = `<table>\n
<thead>\n
<tr>\n
<th align="left" scope="col">Risk ID</th>\n
<th align="left" scope="col">Severity</th>\n
<th align="left" scope="col">Vendor</th>\n
<th align="left" scope="col">Folder/s</th>\n
<th align="left" scope="col">Summary</th>\n
</tr>\n
</thead>\n
<tbody id="tableBody">\n
${risksTableContents}                 
</tbody>
</table>\n`;
        return results.some((result) => { var _a, _b; return ((_b = (_a = result === null || result === void 0 ? void 0 : result.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; })
            ? risksSummary + risksTable
            : "";
    }
    parseCodeAnalysis(filesToUpload, analysisResults) {
        var _a, _b, _c;
        const commentBodyArray = [];
        const header = `<img height="50" src="${this.assetsUrl}/header.svg" /> \n`;
        const footer = `\n\n---\n\n
<br>
Pusher: @${(_a = this._context) === null || _a === void 0 ? void 0 : _a.actor}<br>
Action: \`${(_b = this._context) === null || _b === void 0 ? void 0 : _b.eventName}\`<br>
Working Directory: ${this.workspace}<br>
Workflow: ${(_c = this._context) === null || _c === void 0 ? void 0 : _c.workflow}`;
        const summary = this.buildCommentSummary(filesToUpload, analysisResults);
        const bodyHeading = `\n**Detailed Risks Report**
---\n`;
        filesToUpload.forEach((file) => {
            const fileAnalysis = analysisResults.find((_fileAnalysis) => { var _a; return (_a = _fileAnalysis === null || _fileAnalysis === void 0 ? void 0 : _fileAnalysis.proceeded_file) === null || _a === void 0 ? void 0 : _a.includes(file.uuid); });
            commentBodyArray.push(this.buildCommentAnalysisBody(fileAnalysis === null || fileAnalysis === void 0 ? void 0 : fileAnalysis.additions, file));
        });
        const analysisByFolder = (commentBodyArray === null || commentBodyArray === void 0 ? void 0 : commentBodyArray.length) > 0
            ? bodyHeading + commentBodyArray.join("\n\n---\n\n")
            : "\n\n<h4>No risks were found.</h4>\n\n";
        return header + summary + analysisByFolder + footer;
    }
}
exports.Github = Github;
