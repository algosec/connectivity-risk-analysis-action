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
const getUuid = require('uuid-by-string');
// DEBUG
// import {githubEventPayloadMock } from "../mockData"
// context.payload = githubEventPayloadMock as WebhookPayload & any
class Github {
    constructor() {
        var _a, _b, _c, _d;
        this.steps = {};
        this.http = new http_client_1.HttpClient();
        this.logger = { info: core_1.info, error: core_1.error, debug: core_1.debug, exit: core_1.setFailed };
        this.workspace = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.GITHUB_WORKSPACE;
        this.token = (_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.GITHUB_TOKEN;
        this.sha = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITHUB_SHA;
        this._context = github_1.context;
        this.octokit = (0, github_1.getOctokit)(this.token);
        this.payload = (_d = this._context) === null || _d === void 0 ? void 0 : _d.payload;
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
    convertToMarkdown(analysis, terraform) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const CODE_BLOCK = '```';
        let risksList = '';
        let risksTableContents = '';
        (_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.forEach(risk => {
            risksList +=
                `<details open="true">\n
<summary><img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${risk.riskSeverity}.png" />  ${risk.riskId} | ${risk.riskTitle}</summary> \n
### **Description:**\n${risk.riskDescription}\n
### **Recommendation:**\n${risk.riskRecommendation.toString()}\n
### **Details:**\n
${CODE_BLOCK}\n
${JSON.stringify(risk.items, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`;
            risksTableContents +=
                `<tr>\n
<td>${risk.riskId}</td>\n
<td><img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${risk.riskSeverity}.png" /> ${risk.riskSeverity.charAt(0).toUpperCase() + risk.riskSeverity.slice(1)}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`;
        });
        const analysisIcon = (analysis === null || analysis === void 0 ? void 0 : analysis.analysis_state) ? 'V' : 'X';
        const header = `<img height="50" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/RiskAnalysis${analysisIcon}.svg" /> \n`;
        const risksTable = `<table>\n
<thead>\n
<tr>\n
<th align="left" scope="col">Risk ID</th>\n
<th align="left" scope="col">Severity</th>\n
<th align="left" scope="col">Summary</th>\n
</tr>\n
</thead>\n
<tbody id="tableBody">\n
${risksTableContents}                 
</tbody>
</table>\n`;
        const terraformIcon = (((_b = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _b === void 0 ? void 0 : _b.stderr) == '') ? 'V' : 'X';
        const terraformContent = `\n<img height="50" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/Terraform${terraformIcon}.svg" />\n
<details>
<summary>Terraform Log</summary>
<br>Output<br>
&nbsp;

${CODE_BLOCK}\n
${(_c = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _c === void 0 ? void 0 : _c.stdout}\n
${CODE_BLOCK}\n
Errors\n
${CODE_BLOCK}\n
${(_e = (_d = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _d === void 0 ? void 0 : _d.stderr) !== null && _e !== void 0 ? _e : (_f = terraform === null || terraform === void 0 ? void 0 : terraform.initLog) === null || _f === void 0 ? void 0 : _f.stderr}\n
${CODE_BLOCK}\n
</details> <!-- End Format Logs -->\n`;
        const codeAnalysisContent = `<summary>Report</summary>\n
${risksList}\n
<details>
<summary>Logs</summary>
<br>Output<br>
&nbsp;

${CODE_BLOCK}\n
${JSON.stringify(analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`;
        const markdownOutput = header +
            (((_g = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _g === void 0 ? void 0 : _g.length) > 0 ? risksTable : '') +
            `<details open="true">\n` +
            (((_h = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _h === void 0 ? void 0 : _h.length) > 0 ? codeAnalysisContent : '\n### No Risks Found\n') +
            terraformContent +
            `</details><br>
\n
*Pusher: @${(_j = this._context) === null || _j === void 0 ? void 0 : _j.actor}, Action: \`${(_k = this._context) === null || _k === void 0 ? void 0 : _k.eventName}\`, Working Directory: \'${this.workspace}\', Workflow: \'${(_l = this._context) === null || _l === void 0 ? void 0 : _l.workflow}\'*`;
        return markdownOutput;
    }
    parseCodeAnalysis(filesToUpload, analysisResult) {
        const commentBodyArray = [];
        analysisResult.forEach(folderAnalysis => commentBodyArray.push((!(folderAnalysis === null || folderAnalysis === void 0 ? void 0 : folderAnalysis.additions)) ?
            '' : this.convertToMarkdown(folderAnalysis === null || folderAnalysis === void 0 ? void 0 : folderAnalysis.additions, filesToUpload.find(file => { var _a; return (_a = folderAnalysis === null || folderAnalysis === void 0 ? void 0 : folderAnalysis.proceeded_file) === null || _a === void 0 ? void 0 : _a.includes(file.uuid); }))));
        return commentBodyArray.join('<br><br><br>');
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
            this.logger.info('##### Algosec ##### Step 1 - diffs result: ' + JSON.stringify(diffFolders));
            return diffFolders;
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
                if (analysisResults === null || analysisResults === void 0 ? void 0 : analysisResults.some(response => { var _a; return !((_a = response === null || response === void 0 ? void 0 : response.additions) === null || _a === void 0 ? void 0 : _a.analysis_state); })) {
                    this.logger.exit('##### Algosec ##### The risks analysis process completed successfully with risks, please check report');
                }
                else {
                    this.logger.info('##### Algosec ##### Step 6 - the risks analysis process completed successfully without any risks');
                    return;
                }
            }
        });
    }
    getInputs() {
        return process.env;
    }
    uploadAnalysisFile(actionUuid, body, jwt) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const http = new http_client_1.HttpClient();
            const getPresignedUrl = `${(_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.CF_API_URL}/presignedurl?actionId=${actionUuid}&owner=${github_1.context.repo.owner}`;
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
}
exports.Github = Github;
Github.DEFAULT_GITHUB_URL = 'https://github.com';
