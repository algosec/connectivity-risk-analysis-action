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
exports.Github = void 0;
const github_1 = require("@actions/github");
const core_1 = require("@actions/core");
const http_client_1 = require("@actions/http-client");
const exec_1 = require("@actions/exec");
const exec_2 = require("../common/exec");
const risk_model_1 = require("../common/risk.model");
const getUuid = require('uuid-by-string');
// DEBUG LOCALLY
// import {githubEventPayloadMock } from "../../test/mockData.folder-error"
// context.payload = githubEventPayloadMock as WebhookPayload & any
class Github {
    constructor() {
        var _a, _b, _c, _d, _e, _f;
        this.steps = {};
        this.runMode = (_b = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.MODE) !== null && _b !== void 0 ? _b : 'fail';
        this.http = new http_client_1.HttpClient();
        this.logger = { info: core_1.info, error: core_1.error, debug: core_1.debug, exit: core_1.setFailed };
        this.workspace = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITHUB_WORKSPACE;
        this.token = (_d = process === null || process === void 0 ? void 0 : process.env) === null || _d === void 0 ? void 0 : _d.GITHUB_TOKEN;
        this.sha = (_e = process === null || process === void 0 ? void 0 : process.env) === null || _e === void 0 ? void 0 : _e.GITHUB_SHA;
        this._context = github_1.context;
        this.octokit = (0, github_1.getOctokit)(this.token);
        this.payload = (_f = this._context) === null || _f === void 0 ? void 0 : _f.payload;
        this.repo = this._context.repo;
        this.pullRequest = this._context.payload.pull_request.number.toString();
        this.workDir = this.workspace + '_ALGOSEC_CODE_ANALYSIS';
        this.actionUuid = getUuid(this.sha);
    }
    getDiff(octokit) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield octokit.rest.repos.compareCommits({
                repo: this._context.repo.repo,
                owner: this._context.repo.owner,
                head: (_c = (_b = (_a = this._context) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.pull_request) === null || _c === void 0 ? void 0 : _c.head.sha,
                base: (_f = (_e = (_d = this._context) === null || _d === void 0 ? void 0 : _d.payload) === null || _e === void 0 ? void 0 : _e.pull_request) === null || _f === void 0 ? void 0 : _f.base.sha,
                per_page: 100
            });
            const answer = result.data.files || [];
            return answer;
        });
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
            const args = ['fetch', ...additionalGitOptions];
            return this.cmd(args);
        });
    }
    clone(baseDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing 'git clone' to directory '${baseDirectory}' with token and options `);
            const remote = this.getRepoRemoteUrl();
            let args = ['clone', remote, baseDirectory];
            return this.cmd(args);
        });
    }
    checkout(ghRef, additionalGitOptions = [], ...options) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing 'git checkout' to ref '${ghRef}' with token and options '${options.join(' ')}'`);
            let args = ['checkout', ghRef];
            // if (options.length > 0) {
            //     args = args.concat(options);
            // }
            return this.cmd(args);
        });
    }
    cmd(additionalGitOptions, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing Git: ${args.join(' ')}`);
            const res = yield this.capture('git', additionalGitOptions);
            if (res.exitCode !== 0) {
                throw new Error(`Command 'git ${args.join(' ')}' failed: ${JSON.stringify(res)}`);
            }
            return res;
        });
    }
    capture(cmd, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = {
                stdout: '',
                stderr: '',
                exitCode: null
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
                const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
                (0, core_1.debug)(`@actions/exec.exec() threw an error: ${msg}`);
                throw new Error(msg);
            }
        });
    }
    prepareRepo() {
        return __awaiter(this, void 0, void 0, function* () {
            this.steps.gitClone = yield this.clone(this.workDir); //await exec('git' , ['clone', this.getRepoRemoteUrl(), this.workDir])
            process.chdir(this.workDir);
            this.steps.gitFetch = yield this.fetch(['origin', `pull/${this.pullRequest}/head:${this.actionUuid}`]); //await exec('git' , ['fetch', 'origin', `pull/${this.pullRequest}/head:${this.actionUuid}`])
            this.steps.gitCheckout = yield this.checkout(this.actionUuid); //await exec('git' , ['checkout', this.actionUuid])
        });
    }
    checkForDiffByFileTypes(fileTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prepareRepo();
            let diffFolders = [];
            try {
                const diffs = yield this.getDiff(this.octokit);
                const foldersSet = new Set(diffs
                    .filter(diff => fileTypes === null || fileTypes === void 0 ? void 0 : fileTypes.some(fileType => { var _a; return (_a = diff === null || diff === void 0 ? void 0 : diff.filename) === null || _a === void 0 ? void 0 : _a.endsWith(fileType); }))
                    .map(diff => diff === null || diff === void 0 ? void 0 : diff.filename.split('/')[0]));
                diffFolders = [...foldersSet];
            }
            catch (error) {
                if (error instanceof Error)
                    this.logger.exit(error === null || error === void 0 ? void 0 : error.message);
            }
            if ((diffFolders === null || diffFolders === void 0 ? void 0 : diffFolders.length) == 0) {
                this.logger.info('##### Algosec ##### No changes were found in terraform plans');
                return;
            }
            this.logger.info('##### Algosec ##### Step 2 - diffs result: ' + JSON.stringify(diffFolders));
            return diffFolders;
        });
    }
    getInputs() {
        return process.env;
    }
    uploadAnalysisFile(file, jwt) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const http = new http_client_1.HttpClient();
            const body = JSON.stringify((_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.plan);
            const getPresignedUrl = `${(_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.CF_API_URL}/presignedurl?actionId=${file === null || file === void 0 ? void 0 : file.uuid}&owner=${(_c = github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.repo) === null || _c === void 0 ? void 0 : _c.owner}&folder=${file === null || file === void 0 ? void 0 : file.folder}`;
            const presignedUrlResponse = yield (yield http.get(getPresignedUrl, { 'Authorization': `Bearer ${jwt}` })).readBody();
            const presignedUrl = JSON.parse(presignedUrlResponse).presignedUrl;
            const response = yield (yield http.put(presignedUrl, body, { 'Content-Type': 'application/json' })).readBody();
            if (response == '') {
                return true;
            }
            else {
                (0, core_1.setFailed)(response);
            }
        });
    }
    parseOutput(filesToUpload, analysisResults) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = this.parseCodeAnalysis(filesToUpload, analysisResults);
            if (body && body != '')
                this.steps.comment = yield this.createComment(body);
            if (analysisResults === null || analysisResults === void 0 ? void 0 : analysisResults.some(response => !(response === null || response === void 0 ? void 0 : response.success))) {
                let errors = '';
                // Object.keys(this.steps).forEach(step => errors += this?.steps[step]?.stderr ?? '')
                this.logger.exit('##### Algosec ##### The risks analysis process failed.\n' + errors);
            }
            else {
                this.logger.info('##### Algosec ##### Step 5 - parsing Code Analysis');
                if (analysisResults === null || analysisResults === void 0 ? void 0 : analysisResults.some(response => { var _a, _b; return ((_b = (_a = response === null || response === void 0 ? void 0 : response.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; })) {
                    if (this.runMode == 'fail')
                        this.logger.exit('##### Algosec ##### The risks analysis process completed successfully with risks, please check report');
                    else
                        this.logger.info('##### Algosec ##### The risks analysis process completed successfully with risks, please check report');
                    return;
                }
                else {
                    this.logger.info('##### Algosec ##### Step 6 - the risks analysis process completed successfully without any risks');
                    return;
                }
            }
        });
    }
    buildCommentAnalysisBody(analysis, file) {
        var _a;
        let analysisBody = '';
        if (!(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result)) {
            analysisBody = `<details>\n<summary><h3><b>${file.folder}</b> (Finished with errors)</h3></summary>\n${this.buildCommentFrameworkResult(file)}\n</details>`;
        }
        else if (((_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.length) == 0) {
            analysisBody = `<details>\n<summary><h3><b>${file.folder}</b> (No risks were found)</h3></summary>\n${this.buildCommentFrameworkResult(file)}\n</details>`;
        }
        else {
            analysisBody = `<details>\n${this.buildCommentReportResult(analysis, file)}\n${this.buildCommentFrameworkResult(file)}\n</details>`;
        }
        return analysisBody;
    }
    buildCommentReportResult(analysis, file) {
        var _a, _b;
        let risksList = '';
        const CODE_BLOCK = '```';
        analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result.sort((a, b) => parseInt(risk_model_1.severityOrder[a.riskSeverity]) - parseInt(risk_model_1.severityOrder[b.riskSeverity])).forEach(risk => {
            risksList +=
                `<details>\n
<summary>&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${risk.riskSeverity}.svg" />  ${risk.riskId}</summary> \n
### **Title:**\n${risk.riskTitle}\n
### **Description:**\n${risk.riskDescription}\n
### **Recommendation:**\n${risk.riskRecommendation.toString()}\n
### **Details:**\n
${CODE_BLOCK}\n
${JSON.stringify(risk.items, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`;
        });
        const severityCount = `<div  align="right">${(0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, 'riskSeverity', 'critical') > 0 ? '<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/critical.svg" />&nbsp;' + (0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, 'riskSeverity', 'critical') + '&nbsp;Critical' : ''}${(0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, 'riskSeverity', 'high') > 0 ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/high.svg" />&nbsp;' + (0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, 'riskSeverity', 'high') + '&nbsp;High' : ''}${(0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, 'riskSeverity', 'medium') > 0 ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/medium.svg" />&nbsp;' + (0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, 'riskSeverity', 'medium') + '&nbsp;Medium' : ''}${(0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, 'riskSeverity', 'low') > 0 ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/low.svg" />&nbsp;' + (0, exec_2.count)(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, 'riskSeverity', 'low') + '&nbsp;Low' : ''}</div>`;
        const codeAnalysisContent = `<summary><h3><b>${file.folder + (((_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.length) == 0 ? '- No Risks Found' : '')}</b></h3>${((_b = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0 ? severityCount : ''}</summary>\n${risksList}\n`;
        return codeAnalysisContent;
    }
    buildCommentFrameworkResult(file) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const CODE_BLOCK = '```';
        const frameworkIcon = (((_b = (_a = file === null || file === void 0 ? void 0 : file.output) === null || _a === void 0 ? void 0 : _a.log) === null || _b === void 0 ? void 0 : _b.stderr) == '') ? 'success' : 'failure';
        const errors = `Errors\n
${CODE_BLOCK}\n
${(_e = (_d = (_c = file === null || file === void 0 ? void 0 : file.output) === null || _c === void 0 ? void 0 : _c.log) === null || _d === void 0 ? void 0 : _d.stderr) !== null && _e !== void 0 ? _e : (_g = (_f = file === null || file === void 0 ? void 0 : file.output) === null || _f === void 0 ? void 0 : _f.initLog) === null || _g === void 0 ? void 0 : _g.stderr}\n
${CODE_BLOCK}\n`;
        const output = `Output\n
${CODE_BLOCK}\n
${(_j = (_h = file === null || file === void 0 ? void 0 : file.output) === null || _h === void 0 ? void 0 : _h.log) === null || _j === void 0 ? void 0 : _j.stdout}\n
${CODE_BLOCK}\n`;
        const frameworkContent = `\n<details>
<summary>&nbsp;&nbsp;&nbsp;<img height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${frameworkIcon}.png" /> Terraform Log</summary>
${((_l = (_k = file === null || file === void 0 ? void 0 : file.output) === null || _k === void 0 ? void 0 : _k.log) === null || _l === void 0 ? void 0 : _l.stdout) ? '<br>' + output + '<br>' : ''}
${((_o = (_m = file === null || file === void 0 ? void 0 : file.output) === null || _m === void 0 ? void 0 : _m.log) === null || _o === void 0 ? void 0 : _o.stderr) ? '<br>' + errors + '<br>' : ''}
</details> <!-- End Format Logs -->\n`;
        return frameworkContent;
    }
    buildCommentSummary(filesToUpload, results) {
        let risksTableContents = '';
        const riskArrays = results
            .filter(result => { var _a, _b; return ((_b = (_a = result === null || result === void 0 ? void 0 : result.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; })
            .map(result => {
            var _a;
            const folder = filesToUpload.find(file => { var _a; return (_a = result === null || result === void 0 ? void 0 : result.proceeded_file) === null || _a === void 0 ? void 0 : _a.includes(file.uuid); }).folder;
            return (_a = result === null || result === void 0 ? void 0 : result.additions) === null || _a === void 0 ? void 0 : _a.analysis_result.map(risk => { return { folder, riskId: risk.riskId, riskTitle: risk.riskTitle, riskSeverity: risk.riskSeverity }; });
        });
        const mergedRisks = [].concat.apply([], riskArrays).sort((a, b) => parseInt(risk_model_1.severityOrder[a.riskSeverity]) - parseInt(risk_model_1.severityOrder[b.riskSeverity]));
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
            risksTableContents +=
                `<tr>\n
<td>${risk.riskId}</td>\n
<td align="center"><img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${risk.riskSeverity}.svg" /></td>\n
<td align="center"><sub><img width="15" height="15" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${(_a = risk === null || risk === void 0 ? void 0 : risk.vendor) !== null && _a !== void 0 ? _a : 'aws'}.svg" /></sub></td>\n
<td>${Array.isArray(risk.folder) ? risk.folder.join(', ') : risk.folder}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`;
        });
        const risksSummary = `
\n
<div align="right">${(0, exec_2.count)(mergedRisks, 'riskSeverity', 'critical') > 0 ? '<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/critical.svg" />&nbsp;' + (0, exec_2.count)(mergedRisks, 'riskSeverity', 'critical') + '&nbsp;Critical' : ''}${(0, exec_2.count)(mergedRisks, 'riskSeverity', 'high') > 0 ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/high.svg" />&nbsp;' + (0, exec_2.count)(mergedRisks, 'riskSeverity', 'high') + '&nbsp;High' : ''}${(0, exec_2.count)(mergedRisks, 'riskSeverity', 'medium') > 0 ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/medium.svg" />&nbsp;' + (0, exec_2.count)(mergedRisks, 'riskSeverity', 'medium') + '&nbsp;Medium' : ''}${(0, exec_2.count)(mergedRisks, 'riskSeverity', 'low') > 0 ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/low.svg" />&nbsp;' + (0, exec_2.count)(mergedRisks, 'riskSeverity', 'low') + '&nbsp;Low' : ''}</div><br>
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
        return results.some(result => { var _a, _b; return ((_b = (_a = result === null || result === void 0 ? void 0 : result.additions) === null || _a === void 0 ? void 0 : _a.analysis_result) === null || _b === void 0 ? void 0 : _b.length) > 0; }) ? risksSummary + risksTable : '';
    }
    parseCodeAnalysis(filesToUpload, analysisResults) {
        var _a, _b, _c;
        const commentBodyArray = [];
        const header = `<img height="50" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/header.svg" /> \n`;
        const footer = `<br>
\n
*Pusher: @${(_a = this._context) === null || _a === void 0 ? void 0 : _a.actor}, Action: \`${(_b = this._context) === null || _b === void 0 ? void 0 : _b.eventName}\`, Working Directory: \'${this.workspace}\', Workflow: \'${(_c = this._context) === null || _c === void 0 ? void 0 : _c.workflow}\'*`;
        const summary = this.buildCommentSummary(filesToUpload, analysisResults);
        const bodyHeading = `\n**Detailed Risks Report**
---\n`;
        filesToUpload.forEach(file => {
            const fileAnalysis = analysisResults.find(_fileAnalysis => { var _a; return (_a = _fileAnalysis === null || _fileAnalysis === void 0 ? void 0 : _fileAnalysis.proceeded_file) === null || _a === void 0 ? void 0 : _a.includes(file.uuid); });
            commentBodyArray.push(this.buildCommentAnalysisBody(fileAnalysis === null || fileAnalysis === void 0 ? void 0 : fileAnalysis.additions, file));
        });
        const analysisByFolder = (commentBodyArray === null || commentBodyArray === void 0 ? void 0 : commentBodyArray.length) > 0 ? bodyHeading + commentBodyArray.join(`\n`) : '\n\n<h4>No risks were found.</h4>\n\n';
        return header + summary + analysisByFolder + footer;
    }
}
exports.Github = Github;
Github.DEFAULT_GITHUB_URL = 'https://github.com';
