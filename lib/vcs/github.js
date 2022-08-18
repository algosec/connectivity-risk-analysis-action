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
// DEBUG
// context.payload = githubEventPayloadMock as WebhookPayload & any
class Github {
    constructor() {
        var _a, _b, _c, _d;
        this.http = new http_client_1.HttpClient();
        this.logger = { info: core_1.info, error: core_1.error, debug: core_1.debug, exit: core_1.setFailed };
        this.workspace = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.GITHUB_WORKSPACE;
        this.token = (_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.GH_TOKEN;
        this.sha = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITHUB_SHA;
        this._context = github_1.context;
        this.octokit = (0, github_1.getOctokit)(this.token);
        this.payload = (_d = this._context) === null || _d === void 0 ? void 0 : _d.payload;
        this.repo = this._context.repo;
        this.pullRequest = this._context.payload.pull_request.number.toString();
    }
    init() {
        return this;
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
        return __awaiter(this, void 0, void 0, function* () {
            yield this.octokit.rest.issues.createComment(Object.assign(Object.assign({}, this._context.repo), { issue_number: this._context.issue.number, body }));
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
    // getCurrentRepoRemoteUrl(token: string): string {
    //   const { repo, owner } = this._context.repo;
    //   const serverName = this.getServerName(this._context.payload.repository?.html_url);
    //   return this.getRepoRemoteUrl(token, `${serverName}/${owner}/${repo}`);
    // }
    getRepoRemoteUrl() {
        // return `https://x-access-token:${token}@${repoUrl}.git`;
        return `https://${this.repo.owner}:${this.token}@github.com/${this.repo.owner}/${this.repo.repo}.git`;
    }
    getServerName(repositoryUrl) {
        const urlObj = repositoryUrl ? new URL(repositoryUrl) : new URL(Github.DEFAULT_GITHUB_URL);
        return repositoryUrl ? urlObj.hostname : Github.DEFAULT_GITHUB_URL.replace('https://', '');
    }
    clone(token, context, baseDirectory, additionalGitOptions = [], ...options) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing 'git clone' to directory '${baseDirectory}' with token and options '${options.join(' ')}'`);
            const remote = this.getRepoRemoteUrl();
            let args = ['clone', remote, baseDirectory];
            if (options.length > 0) {
                args = args.concat(options);
            }
            // return this.cmd(additionalGitOptions, context, ...args);
            return Promise.resolve('');
        });
    }
    checkout(ghRef, additionalGitOptions = [], ...options) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, core_1.debug)(`Executing 'git checkout' to ref '${ghRef}' with token and options '${options.join(' ')}'`);
            let args = ['checkout', ghRef];
            if (options.length > 0) {
                args = args.concat(options);
            }
            // return this.cmd(additionalGitOptions, context, ...args);
            return Promise.resolve('');
        });
    }
    getServerUrl(repositoryUrl) {
        const urlObj = repositoryUrl ? new URL(repositoryUrl) : new URL(Github.DEFAULT_GITHUB_URL);
        return repositoryUrl ? urlObj.origin : Github.DEFAULT_GITHUB_URL;
    }
}
exports.Github = Github;
Github.DEFAULT_GITHUB_URL = 'https://github.com';
