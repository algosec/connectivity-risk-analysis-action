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
const uuid_by_string_1 = __importDefault(require("uuid-by-string"));
const fs_1 = require("fs");
const risk_model_1 = require("../common/risk.model");
class Github {
    constructor() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
        this.steps = {};
        this.useCheckoutAction = false;
        this.runFullAnalysis = false;
        this.runFullAnalysis = ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.FULL_ANALYSIS) == 'true';
        this.stopWhenFail = ((_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.STOP_WHEN_FAIL) != 'false';
        this.http = new http_client_1.HttpClient();
        const dateFormatter = (isoDate) => (isoDate === null || isoDate === void 0 ? void 0 : isoDate.split("T")[0].split("-").reverse().join("/")) + " " + isoDate.split("T")[1].replace("Z", "");
        const prefix = (str, group = false, close = true) => (group ? '::group::' : '- ') + dateFormatter(new Date().toISOString()) + ' ##### IAC Connectivity Risk Analysis ##### ' + str + (close && group ? '\n::endgroup::' : '');
        this.logger = {
            debug: (str, group = false) => (0, core_1.debug)(prefix(str, group)),
            error: (str, group = false) => (0, core_1.error)(prefix(str, group)),
            exit: (str, group = false) => (0, core_1.setFailed)(prefix(str, group)),
            info: (str, group = false, close = true) => (0, core_1.info)(prefix(str, group, close))
        };
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
        this.cfApiUrl = (_t = (_s = process === null || process === void 0 ? void 0 : process.env) === null || _s === void 0 ? void 0 : _s.CF_API_URL) !== null && _t !== void 0 ? _t : "https://api-feature-cs-0025342.dev.cloudflow.algosec.com/cloudflow/api/devsecops/v1";
    }
    exec(cmd, args) {
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
    count(array, property, value) {
        return array === null || array === void 0 ? void 0 : array.filter((obj) => obj[property] === value).length;
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
    getDirectories(source) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, fs_1.readdirSync)(source, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
        });
    }
    getFoldersList(dirName) {
        let folders = [];
        const items = (0, fs_1.readdirSync)(dirName, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                folders = [...folders, ...this.getFoldersList(`${dirName}/${item.name}`)];
                folders.push(`${dirName}/${item.name}`);
            }
        }
        return folders;
    }
    ;
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
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.octokit.rest.issues.createComment(Object.assign(Object.assign({}, this._context.repo), { issue_number: this._context.issue.number, body }));
            return {
                exitCode: ((_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.body) ? 0 : 1,
                stdout: ((_b = result === null || result === void 0 ? void 0 : result.data) === null || _b === void 0 ? void 0 : _b.body) ? (_c = result === null || result === void 0 ? void 0 : result.data) === null || _c === void 0 ? void 0 : _c.body : null,
                stderr: ((_d = result === null || result === void 0 ? void 0 : result.data) === null || _d === void 0 ? void 0 : _d.body) ? null : (_e = result === null || result === void 0 ? void 0 : result.data) === null || _e === void 0 ? void 0 : _e.body,
                url: (_f = result === null || result === void 0 ? void 0 : result.data) === null || _f === void 0 ? void 0 : _f.html_url
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
            this.steps.gitClone = yield this.clone(this.workDir); // await this.exec('git' , ['clone', this.getRepoRemoteUrl(), this.workDir])
            process.chdir(this.workDir);
            this.steps.gitFetch = yield this.fetch([
                "origin",
                `pull/${this.pullRequest}/head:${this.actionUuid}`,
            ]); // await this.exec('git' , ['fetch', 'origin', `pull/${this.pullRequest}/head:${this.actionUuid}`])
            this.steps.gitCheckout = yield this.checkout(this.actionUuid); // await this.exec('git' , ['checkout', this.actionUuid])
        });
    }
    checkForDiffByFileTypes(fileTypes) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.useCheckoutAction) {
                yield this.prepareRepo();
            }
            let diffFolders = [];
            try {
                const allFoldersPaths = yield this.getFoldersList(this.workDir);
                if (this.runFullAnalysis) {
                    diffFolders = allFoldersPaths.filter(folder => this.hasFileType(folder, fileTypes));
                }
                else {
                    const diffs = yield this.getDiff(this.octokit);
                    const foldersSet = new Set(diffs
                        .filter((diff) => fileTypes === null || fileTypes === void 0 ? void 0 : fileTypes.some((fileType) => { var _a; return (_a = diff === null || diff === void 0 ? void 0 : diff.filename) === null || _a === void 0 ? void 0 : _a.endsWith(fileType); }))
                        .map(diff => diff.filename.split("/").splice(0, (diff === null || diff === void 0 ? void 0 : diff.filename.split("/").length) - 1).join("/"))
                        .map((diff) => allFoldersPaths.find(path => path.endsWith(diff))));
                    diffFolders = [...foldersSet];
                }
            }
            catch (error) {
                if (error instanceof Error)
                    this.logger.exit((_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : error === null || error === void 0 ? void 0 : error.toString());
            }
            if ((diffFolders === null || diffFolders === void 0 ? void 0 : diffFolders.length) == 0) {
                this.logger.info("No changes were found");
                return [];
            }
            // this.logger.info(
            // `Running IaC on folders:\n ${diffFolders.join(',\n')}`
            // );
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
                this.logger.error(`Upload file failed due to errors:\n${e}\n`);
                return false;
            }
        });
    }
    parseOutput(filesToUpload, analysisResults, errorMessage) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug(`analysis result :${JSON.stringify(analysisResults)}, error: ${errorMessage}`);
            try {
                const body = this.parseCodeAnalysis(filesToUpload, analysisResults, errorMessage);
                if (body && body != "")
                    this.steps.comment = yield this.createComment(body);
                let commentUrl = "";
                try {
                    commentUrl = (_a = this.steps) === null || _a === void 0 ? void 0 : _a.comment["url"];
                }
                catch (e) {
                    this.logger.error("Failed to create report: " + e);
                }
                if (analysisResults === null || analysisResults === void 0 ? void 0 : analysisResults.some((response) => { var _a, _b; return (response === null || response === void 0 ? void 0 : response.additions) && ((_b = (_a = response === null || response === void 0 ? void 0 : response.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; })) {
                    this.logger[this.stopWhenFail ? 'exit' : 'info']("The risks analysis process completed successfully with risks, please check report: " + commentUrl);
                }
                else if (errorMessage) {
                    this.logger[this.stopWhenFail ? 'exit' : 'info']("The risks analysis process completed with errors or without any risks, please check action's logs: " + commentUrl);
                }
                else {
                    this.logger['info']("The risks analysis process completed with errors or without any risks, please check action's logs: " + commentUrl);
                }
            }
            catch (error) {
                this.logger.error(`Failed to analyze the result. Error: ${JSON.stringify(console.error())} `);
                this.logger[this.stopWhenFail ? 'exit' : 'info']("The risks analysis process completed with error, please check action's logs:");
            }
        });
    }
    buildCommentAnalysisBody(analysis, file) {
        var _a, _b;
        let analysisBody = "";
        if (!(analysis === null || analysis === void 0 ? void 0 : analysis.additions)) {
            analysisBody = `<details>\n < summary > <sub><sub><sub><a href="#" > <img  height="20" width = "20" src = "${this.assetsUrl}/failure.svg" / > </a></sub > </sub></sub >& nbsp;& nbsp; <h3><b>${file.folder} </b></h3 > </summary>\n${this.buildCommentFrameworkResult(file)}\n${(!(analysis === null || analysis === void 0 ? void 0 : analysis.error) || (analysis === null || analysis === void 0 ? void 0 : analysis.error) == '') ? "" : this.buildCommentReportError(analysis)} \n < /details>`;
        }
        else if (((_b = (_a = analysis === null || analysis === void 0 ? void 0 : analysis.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) == 0) {
            analysisBody = `<details>\n<summary><sub><sub><sub><a href="#"><img  height="20" width="20" src="${this.assetsUrl}/success.svg" /></a></sub></sub></sub>&nbsp;&nbsp;<h3><b>${file.folder}</b></h3></summary>\n${this.buildCommentFrameworkResult(file)}\n</details>`;
        }
        else {
            analysisBody = `<details>\n${this.buildCommentReportResult(analysis === null || analysis === void 0 ? void 0 : analysis.additions, file)}\n${this.buildCommentFrameworkResult(file)}\n</details>`;
        }
        return analysisBody;
    }
    buildCommentReportResult(analysis, file) {
        var _a, _b, _c;
        let risksList = "";
        const CODE_BLOCK = "```";
        (_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.sort((a, b) => parseInt(risk_model_1.severityOrder[a.riskSeverity]) -
            parseInt(risk_model_1.severityOrder[b.riskSeverity])).forEach((risk) => {
            var _a, _b;
            risksList += `<details>\n
<summary><a href="#"><img  width="10" height="10" src="${this.assetsUrl}/${risk.riskSeverity}.svg" /></a>  ${risk.riskId}</summary> \n
### **Title:**\n${risk.riskTitle}\n
### **Description:**\n${risk.riskDescription}\n
### **Recommendation:**\n${risk.riskRecommendation.toString()}\n
### **Details:**\n` +
                // ${CODE_BLOCK}\n
                // ${JSON.stringify(risk.items, null, "\t")}\n
                // ${CODE_BLOCK}\n
                `<table>
<thead>\n
<tr>\n
<th align="left" scope="col">Vendor</th>\n
<th align="left" scope="col">From Port</th>\n
<th align="left" scope="col">To Port</th>\n
<th align="left" scope="col">Ip Protocol</th>\n
<th align="left" scope="col">Ip Range</th>\n
</tr>\n
</thead>\n
<tbody id="tableBody">\n
${(_b = (_a = risk === null || risk === void 0 ? void 0 : risk.items) === null || _a === void 0 ? void 0 : _a.map(item => {
                    var _a;
                    return `<tr>\n
  <td>${item === null || item === void 0 ? void 0 : item.vendor}</td>\n
  <td>${item === null || item === void 0 ? void 0 : item.fromPort}</td>\n
  <td>${item === null || item === void 0 ? void 0 : item.toPort}</td>\n
  <td>${item === null || item === void 0 ? void 0 : item.ipProtocol}</td>\n
  <td>${(_a = item === null || item === void 0 ? void 0 : item.ipRange) !== null && _a !== void 0 ? _a : ''}</td>\n
  </tr>\n`;
                })) === null || _b === void 0 ? void 0 : _b.join('')}                
</tbody>
</table>\n
</details>\n`;
        });
        const severityCount = `<div  align="right">${this.count(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "critical") > 0
            ? `<a href="#"><img  width="10" height="10" src="${this.assetsUrl}/critical.svg" /></a>&nbsp;` +
                this.count(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "critical") +
                "&nbsp;Critical"
            : ""}${this.count(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "high") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="#"><img  width="10" height="10" src="${this.assetsUrl}/high.svg" /></a>&nbsp;` +
                this.count(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "high") +
                "&nbsp;High"
            : ""}${this.count(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "medium") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="#"><img  width="10" height="10" src="${this.assetsUrl}/medium.svg" /></a>&nbsp;` +
                this.count(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "medium") +
                "&nbsp;Medium"
            : ""}${this.count(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "low") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="#"><img  width="10" height="10" src="${this.assetsUrl}/low.svg" /></a>&nbsp;` +
                this.count(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, "riskSeverity", "low") +
                "&nbsp;Low"
            : ""}</div>`;
        const codeAnalysisContent = `<summary><sub><sub><sub><a href="#"><img  height="20" width="20" src="${this.assetsUrl}/warning.svg" /></a></sub></sub></sub>&nbsp;&nbsp;<h3><b>${file.folder +
            (((_b = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _b === void 0 ? void 0 : _b.length) == 0 ? "No Risks Found" : "")}</b></h3>${((_c = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _c === void 0 ? void 0 : _c.length) > 0 ? severityCount : ""}</summary>\n${risksList}\n`;
        return codeAnalysisContent;
    }
    buildCommentReportError(result) {
        const CODE_BLOCK = "```";
        const errors = `Errors\n
${CODE_BLOCK}\n
${result === null || result === void 0 ? void 0 : result.error}\n
${CODE_BLOCK}\n`;
        const analysisContent = `\n<details>
<summary>Analysis Log</summary>
${!(result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.error) == '' ? "Analysis Failed, check action logs" : "<br>" + errors + "<br>"}
</details> <!-- End Format Logs -->\n`;
        return analysisContent;
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
        var _a;
        let risksTableContents = "";
        const riskArrays = results
            .filter((result) => { var _a, _b; return (result === null || result === void 0 ? void 0 : result.additions) && ((_b = (_a = result === null || result === void 0 ? void 0 : result.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; })
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
        const mergedRisks = (_a = [].concat.apply([], riskArrays)) === null || _a === void 0 ? void 0 : _a.sort((a, b) => parseInt(risk_model_1.severityOrder[a.riskSeverity]) -
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
            var _a, _b;
            risksTableContents += `<tr>\n
<td>${risk.riskId}</td>\n
<td align="center"><a href="#"><img  width="10" height="10" src="${this.assetsUrl}/${risk === null || risk === void 0 ? void 0 : risk.riskSeverity}.svg" /></a></td>\n
<td align="center"><sub><a href="#"><img  width="24" height="24" src="${this.assetsUrl}/${(_b = (_a = risk === null || risk === void 0 ? void 0 : risk.vendor) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : "aws"}.svg" /></a></sub></td>\n
<td>${Array.isArray(risk.folder) ? risk.folder.join(", ") : risk.folder}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`;
        });
        const risksSummary = `
\n
<div align="right">${this.count(mergedRisks, "riskSeverity", "critical") > 0
            ? `<a href="#"><img  width="10" height="10" src="${this.assetsUrl}/critical.svg" /></a>&nbsp;` +
                this.count(mergedRisks, "riskSeverity", "critical") +
                "&nbsp;Critical"
            : ""}${this.count(mergedRisks, "riskSeverity", "high") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="#"><img  width="10" height="10" src="${this.assetsUrl}/high.svg" /></a>&nbsp;` +
                this.count(mergedRisks, "riskSeverity", "high") +
                "&nbsp;High"
            : ""}${this.count(mergedRisks, "riskSeverity", "medium") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="#"><img  width="10" height="10" src="${this.assetsUrl}/medium.svg" /></a>&nbsp;` +
                this.count(mergedRisks, "riskSeverity", "medium") +
                "&nbsp;Medium"
            : ""}${this.count(mergedRisks, "riskSeverity", "low") > 0
            ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="#"><img  width="10" height="10" src="${this.assetsUrl}/low.svg" /></a>&nbsp;` +
                this.count(mergedRisks, "riskSeverity", "low") +
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
        return results.some((result) => { var _a, _b; return (result === null || result === void 0 ? void 0 : result.additions) && ((_b = (_a = result === null || result === void 0 ? void 0 : result.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; })
            ? risksSummary + risksTable
            : "";
    }
    parseCodeAnalysis(filesToUpload, analysisResults, errMsg) {
        var _a, _b, _c;
        const commentBodyArray = [];
        const header = `<a href="#"><img  height="50" src="${this.assetsUrl}/header.svg" /></a> \n`;
        const footer = `\n\n---\n\n
<br>
Pusher: @${(_a = this._context) === null || _a === void 0 ? void 0 : _a.actor}<br>
Action: ${(_b = this._context) === null || _b === void 0 ? void 0 : _b.eventName}<br>
Workflow: ${(_c = this._context) === null || _c === void 0 ? void 0 : _c.workflow}`;
        const summary = this.buildCommentSummary(filesToUpload, analysisResults);
        const bodyHeading = `\n**Detailed Risks Report**
---\n`;
        filesToUpload.forEach((file) => {
            const fileAnalysis = analysisResults.find((_fileAnalysis) => { var _a; return (_a = _fileAnalysis === null || _fileAnalysis === void 0 ? void 0 : _fileAnalysis.proceeded_file) === null || _a === void 0 ? void 0 : _a.includes(file.uuid); });
            commentBodyArray.push(this.buildCommentAnalysisBody(fileAnalysis, file));
        });
        const analysisByFolder = (commentBodyArray === null || commentBodyArray === void 0 ? void 0 : commentBodyArray.length) > 0
            ? bodyHeading + commentBodyArray.join("\n\n---\n\n")
            : "\n\n<h4>No risks were found.</h4>\n\n";
        if ((filesToUpload === null || filesToUpload === void 0 ? void 0 : filesToUpload.length) == 0 && (analysisResults === null || analysisResults === void 0 ? void 0 : analysisResults.length) == 0) {
            return header + `<br><br><sub><sub><sub><a href="#"><img height="20" width="20" src="${this.assetsUrl}/failure.svg" /></a></sub></sub></sub>&nbsp;&nbsp;<b>` + errMsg + "</b><br><br>" + footer;
        }
        return header + summary + analysisByFolder + footer;
    }
}
exports.Github = Github;
