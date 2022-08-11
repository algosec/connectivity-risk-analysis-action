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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const http_client_1 = require("@actions/http-client");
const git_1 = require("./vcs/git");
const exec_1 = require("@actions/exec");
const fs_1 = require("fs");
require("dotenv/config");
const aws_1 = require("./providers/aws");
const getUuid = require('uuid-by-string');
// import {WebhookPayload} from '@actions/github/lib/interfaces'
// import {githubEventPayloadMock, riskAnalysisMock, terraformPlanFileMock} from './mockData'
// context.payload = githubEventPayloadMock as WebhookPayload & any
const ghToken = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.GITHUB_TOKEN;
const debugMode = (_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.ALGOSEC_DEBUG;
const ghSha = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITHUB_SHA;
const apiUrl = (_d = process === null || process === void 0 ? void 0 : process.env) === null || _d === void 0 ? void 0 : _d.RA_API_URL;
const s3Dest = (_e = process === null || process === void 0 ? void 0 : process.env) === null || _e === void 0 ? void 0 : _e.AWS_S3;
const tenantId = (_f = process === null || process === void 0 ? void 0 : process.env) === null || _f === void 0 ? void 0 : _f.TENANT_ID;
const clientId = (_g = process === null || process === void 0 ? void 0 : process.env) === null || _g === void 0 ? void 0 : _g.CF_CLIENT_ID;
const clientSecret = (_h = process === null || process === void 0 ? void 0 : process.env) === null || _h === void 0 ? void 0 : _h.CF_CLIENT_SECRET;
const loginAPI = (_j = process === null || process === void 0 ? void 0 : process.env) === null || _j === void 0 ? void 0 : _j.CF_LOGIN_API;
const actionUuid = getUuid(ghSha);
const githubWorkspace = (_k = process === null || process === void 0 ? void 0 : process.env) === null || _k === void 0 ? void 0 : _k.GITHUB_WORKSPACE; //+'_'+actionUuid
const http = new http_client_1.HttpClient();
const workDir = githubWorkspace + '_' + actionUuid;
function changedFolders() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const octokit = (0, github_1.getOctokit)(ghToken);
        const git = new git_1.GitProcessorExec();
        let diffFolders;
        try {
            if (octokit && ((_a = github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.payload) === null || _a === void 0 ? void 0 : _a.pull_request)) {
                const diffs = yield git.getDiff(octokit);
                const foldersSet = new Set(diffs
                    .filter(diff => { var _a; return (_a = diff === null || diff === void 0 ? void 0 : diff.filename) === null || _a === void 0 ? void 0 : _a.endsWith('.tf'); })
                    .map(diff => diff === null || diff === void 0 ? void 0 : diff.filename.split('/')[0]));
                diffFolders = [...foldersSet];
            }
        }
        catch (error) {
            if (error instanceof Error)
                (0, core_1.setFailed)(error.message);
        }
        return diffFolders;
    });
}
function terraform(diffFolder) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const steps = {};
            process.chdir(`${workDir}/${diffFolder}`);
            // steps.setupVersion = await exec('curl', ['-L', 'https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh', '|', 'bash']);
            // info('##### Algosec ##### tfswitch Installed successfully')
            // if (process?.env?.TF_VERSION == "latest"  || process?.env?.TF_VERSION  == ""){
            //   steps.switchVersion = await exec('tfswitch', ['--latest']);
            // } else {
            //   steps.switchVersion = await exec('tfswitch', []);
            // }
            (0, core_1.info)('##### Algosec ##### tfswitch version: ' + ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.TF_VERSION));
            steps.init = yield exec('terraform', ['init']);
            steps.fmt = yield exec('terraform', ['fmt', '-diff']);
            steps.validate = yield exec('terraform', ['validate', '-no-color']);
            if (!(0, fs_1.existsSync)('./tmp')) {
                yield exec('mkdir', ['tmp']);
            }
            steps.plan = yield exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf-${diffFolder}.out`]);
            const initLog = {
                stdout: steps.init.stdout.concat(steps.fmt.stdout, steps.validate.stdout, steps.plan.stdout),
                stderr: steps.init.stderr.concat(steps.fmt.stderr, steps.validate.stderr, steps.plan.stderr)
            };
            let jsonPlan = {};
            if (steps.plan.stdout) {
                jsonPlan = JSON.parse((yield exec('terraform', ['show', '-json', `${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf-${diffFolder}.out`])).stdout);
            }
            process.chdir(workDir);
            return { plan: jsonPlan, log: steps.plan, initLog };
        }
        catch (error) {
            if (error instanceof Error)
                console.log(error.message); //setFailed(error.message)
        }
    });
}
function parseRiskAnalysis(analysis, terraform) {
    const body = parseToGithubSyntax(analysis, terraform);
    return body;
}
function parseToGithubSyntax(analysis, terraform) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const CODE_BLOCK = '```';
    let risksList = '';
    let risksTableContents = '';
    (_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.forEach(risk => {
        risksList +=
            `<details open="true">\n
<summary><img width="10" height="10" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/${risk.riskSeverity}.png" />  ${risk.riskId} | ${risk.riskTitle}</summary> \n
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
<td><img width="10" height="10" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/${risk.riskSeverity}.png" /> ${risk.riskSeverity.charAt(0).toUpperCase() + risk.riskSeverity.slice(1)}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`;
    });
    const analysisIcon = (analysis === null || analysis === void 0 ? void 0 : analysis.analysis_state) ? 'X' : 'V';
    const header = `<img height="35" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/RiskAnalysis${analysisIcon}.svg" /> \n`;
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
    const terraformIcon = (((_b = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _b === void 0 ? void 0 : _b.stderr) == '' && ((_c = terraform === null || terraform === void 0 ? void 0 : terraform.initLog) === null || _c === void 0 ? void 0 : _c.stderr) == '') ? 'X' : 'V';
    const terraformContent = `\n<img height="22" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/Terraform${terraformIcon}.svg" />\n
<details>
<summary>Terraform Log</summary>
<br>Output<br>
&nbsp;

${CODE_BLOCK}\n
${(_d = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _d === void 0 ? void 0 : _d.stdout}\n
${CODE_BLOCK}\n
Errors\n
${CODE_BLOCK}\n
${(_f = (_e = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _e === void 0 ? void 0 : _e.stderr) !== null && _f !== void 0 ? _f : terraform === null || terraform === void 0 ? void 0 : terraform.initLog.stderr}\n
${CODE_BLOCK}\n
</details> <!-- End Format Logs -->\n`;
    const riskAnalysisContent = `<summary>Report</summary>\n
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
        (((_h = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _h === void 0 ? void 0 : _h.length) > 0 ? riskAnalysisContent : 'No Risks Found\n') +
        terraformContent +
        `</details>\n` +
        `<br>*Pusher: @${github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.actor}, Action: \`${github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.eventName}\`, Working Directory: \'${githubWorkspace}\', Workflow: \'${github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.workflow}\'*`;
    return markdownOutput;
}
function pollRiskAnalysisResponse() {
    return __awaiter(this, void 0, void 0, function* () {
        let analysisResult = yield checkRiskAnalysisResponse();
        for (let i = 0; i < 50; i++) {
            yield wait(3000);
            analysisResult = yield checkRiskAnalysisResponse();
            if (analysisResult) {
                (0, core_1.info)('##### Algosec ##### Response: ' + JSON.stringify(analysisResult));
                break;
            }
        }
        return analysisResult;
    });
}
function wait(ms = 1000) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            // console.log(`waiting ${ms} ms...`);
            setTimeout(resolve, ms);
        });
    });
}
function checkRiskAnalysisResponse() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const pollUrl = `${apiUrl}?customer=${github_1.context.repo.owner}&action_id=${actionUuid}`;
        const response = yield http.get(pollUrl);
        if (((_a = response === null || response === void 0 ? void 0 : response.message) === null || _a === void 0 ? void 0 : _a.statusCode) == 200) {
            const message = JSON.parse(yield response.readBody());
            if (message === null || message === void 0 ? void 0 : message.message_found) {
                return JSON.parse(message.result);
            }
            else {
                return null;
            }
        }
        else {
            (0, core_1.setFailed)('##### Algosec ##### Poll Request failed: ' + response.message.statusMessage);
        }
    });
}
function uploadFile(json, jwt) {
    return __awaiter(this, void 0, void 0, function* () {
        const aws = new aws_1.AwsProvider(actionUuid, s3Dest);
        let res = false;
        if (json) {
            const ans = yield aws.uploadToS3(tenantId, JSON.stringify(json), jwt);
            if (ans) {
                res = true;
            }
        }
        return res;
    });
}
function exec(cmd, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = {
            stdout: '',
            stderr: '',
            code: null,
        };
        try {
            const code = yield (0, exec_1.exec)(cmd, args, {
                listeners: {
                    stdout(data) {
                        res.stdout += data.toString();
                        (0, core_1.debug)(`##### Algosec ##### stdout: ${res.stdout}`);
                    },
                    stderr(data) {
                        res.stderr += data.toString();
                        (0, core_1.debug)(`##### Algosec ##### stderr: ${res.stderr}`);
                    },
                },
            });
            res.code = code;
            return res;
        }
        catch (err) {
            const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
            (0, core_1.debug)(`##### Algosec ##### @actions/exec.exec() threw an error: ${msg}`);
            throw new Error(msg);
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const steps = {};
            const jwt = yield auth(tenantId, clientId, clientSecret, loginAPI);
            if (!jwt || jwt == '') {
                (0, core_1.setFailed)('##### Algosec ##### Step 0 Failed to generate token');
                return;
            }
            steps.auth = { code: 0, stdout: jwt, stderr: '' };
            if (debugMode) {
                yield exec('rimraf', [workDir]);
            }
            steps.gitClone = yield exec('git', ['clone', `https://${github_1.context.repo.owner}:${ghToken}@github.com/${github_1.context.repo.owner}/${github_1.context.repo.repo}.git`, workDir]);
            process.chdir(workDir);
            steps.gitFetch = yield exec('git', ['fetch', 'origin', `pull/${github_1.context.payload.pull_request.number.toString()}/head:${actionUuid}`]);
            steps.gitCheckout = yield exec('git', ['checkout', actionUuid]);
            const diffs = yield changedFolders();
            if ((diffs === null || diffs === void 0 ? void 0 : diffs.length) == 0) {
                (0, core_1.info)('##### Algosec ##### No changes were found in terraform plans');
                return;
            }
            (0, core_1.info)('##### Algosec ##### Step 1 - Diffs Result: ' + JSON.stringify(diffs));
            const diffPromises = [];
            diffs.forEach(diff => diffPromises.push(initRiskAnalysis(steps, diff)));
            const response = yield Promise.all(diffPromises);
            console.log(response);
        }
        catch (error) {
            console.log(error);
        }
    });
}
function initRiskAnalysis(steps, diff) {
    return __awaiter(this, void 0, void 0, function* () {
        const terraformResult = yield terraform(diff);
        (0, core_1.info)(`##### Algosec ##### Step 2 - Terraform Result for folder ${diff}: ${JSON.stringify(terraformResult)}`);
        let analysisResult;
        const fileUploaded = yield uploadFile(terraformResult === null || terraformResult === void 0 ? void 0 : terraformResult.plan, steps.auth.stdout);
        // const fileUploaded = await uploadFile(terraformPlanFileMock)
        if (fileUploaded) {
            (0, core_1.info)('##### Algosec ##### Step 3 - File Uploaded to S3 Successfully');
            analysisResult = yield pollRiskAnalysisResponse();
            // let analysisResult = riskAnalysisMock
        }
        if (!analysisResult) {
            (0, core_1.setFailed)('##### Algosec ##### Risk Analysis failed to due timeout');
            return;
        }
        (0, core_1.info)('##### Algosec ##### Step 4 - Risk Analysis Result: ' + JSON.stringify(analysisResult));
        const risks = analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.additions;
        const commentBody = parseRiskAnalysis(risks, terraformResult);
        // git.createComment(commentBody , octokit, context)
        steps.comment = yield exec('gh', ['pr', 'comment', github_1.context.payload.pull_request.number.toString(), '-b', commentBody]);
        if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.success) {
            (0, core_1.info)('##### Algosec ##### Step 5 - Parsing Risk Analysis');
            if (risks === null || risks === void 0 ? void 0 : risks.analysis_state) {
                (0, core_1.info)('##### Algosec ##### Step 6 - The risks analysis process completed successfully without any risks');
                return;
            }
            else {
                (0, core_1.setFailed)('##### Algosec ##### The risks analysis process completed successfully with risks, please check report');
            }
        }
        else {
            let errors = '';
            Object.keys(steps).forEach(step => errors += steps[step].stderr);
            (0, core_1.setFailed)('##### Algosec ##### The risks analysis process completed with errors:\n' + errors);
        }
    });
}
function auth(tenantId, clientID, clientSecret, loginAPI) {
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
            const res = yield http.post(loginAPI, JSON.stringify(payload), headers);
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
run();
