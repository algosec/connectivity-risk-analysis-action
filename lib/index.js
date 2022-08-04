"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const http_client_1 = require("@actions/http-client");
const git_1 = require("./vcs/git");
const exec_1 = require("@actions/exec");
const fs_1 = require("fs");
const AWS = __importStar(require("aws-sdk"));
require("dotenv/config");
const getUuid = require('uuid-by-string');
// import {WebhookPayload} from '@actions/github/lib/interfaces'
// import {githubEventPayloadMock, riskAnalysisMock} from './pull-request'
// context.payload = githubEventPayloadMock as WebhookPayload & any
const ghToken = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.GITHUB_TOKEN;
const debugMode = (_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.ALGOSEC_DEBUG;
const ghSha = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITHUB_SHA;
const apiUrl = process.env.RA_API_URL;
const s3Dest = (_d = process === null || process === void 0 ? void 0 : process.env) === null || _d === void 0 ? void 0 : _d.AWS_S3;
const githubWorkspace = (_e = process === null || process === void 0 ? void 0 : process.env) === null || _e === void 0 ? void 0 : _e.GITHUB_WORKSPACE;
const actionUuid = getUuid(ghSha);
const http = new http_client_1.HttpClient();
function changedFolders() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const octokit = (0, github_1.getOctokit)(ghToken);
        const git = new git_1.GitProcessorExec();
        let diffFolders;
        try {
            if (octokit && ((_a = github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.payload) === null || _a === void 0 ? void 0 : _a.pull_request)) {
                const diffs = yield git.getDiff(octokit, github_1.context);
                const foldersSet = new Set(diffs
                    .filter(diff => { var _a; return (_a = diff === null || diff === void 0 ? void 0 : diff.filename) === null || _a === void 0 ? void 0 : _a.endsWith('.tf'); })
                    .map(diff => diff === null || diff === void 0 ? void 0 : diff.filename.split('/')[0]));
                diffFolders = [...foldersSet];
            }
        }
        catch (error) {
            if (error instanceof Error)
                console.log(error.message); //setFailed(error.message)
        }
        return diffFolders;
    });
}
function terraform(diffFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const diffPromises = []
            // diffs.filter(diff => diff !== 'tf-test-sg').forEach(diff =>  diffPromises.push(exec('sh', ['tf-run.sh', `${process?.cwd()}`, githubWorkspace, diff])))
            const steps = {};
            process.chdir(`${githubWorkspace}/${diffFolder}`);
            steps.init = yield exec('terraform', ['init']);
            steps.fmt = yield exec('terraform', ['fmt', '-diff']);
            steps.validate = yield exec('terraform', ['validate', '-no-color']);
            if (!(0, fs_1.existsSync)('./tmp')) {
                yield exec('mkdir', ['tmp']);
            }
            steps.plan = yield exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf.out`]);
            const initLog = {
                stdout: steps.init.stdout.concat(steps.fmt.stdout, steps.validate.stdout, steps.plan.stdout),
                stderr: steps.init.stderr.concat(steps.fmt.stderr, steps.validate.stderr, steps.plan.stderr)
            };
            let jsonPlan = {};
            if (steps.plan.stdout) {
                jsonPlan = JSON.parse((yield exec('terraform', ['show', '-json', `${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf.out`])).stdout);
            }
            process.chdir(githubWorkspace);
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
    var _a, _b, _c, _d, _e, _f, _g;
    const CODE_BLOCK = '```';
    let risksList = '';
    let risksTableContents = '';
    (_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.forEach(risk => {
        risksList +=
            `<details open="true">\n
<summary><img width="10" height="10" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/${risk.riskSeverity}.png" />  ${risk.riskId} | ${risk.riskTitle}</summary> \n
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
<td><img width="10" height="10" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/${risk.riskSeverity}.png" /> ${risk.riskSeverity.charAt(0).toUpperCase() + risk.riskSeverity.slice(1)}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`;
    });
    const analysisIcon = (analysis === null || analysis === void 0 ? void 0 : analysis.analysis_state) ? 'success' : 'failure';
    const header = `## <img height="35" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/algosec_logo.png" /><sup> &nbsp; Connectivity Risk Analysis &nbsp; <sub><sub><img height="22" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/${analysisIcon}.png" /><sub><sub><sup><sup> \n`;
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
    const terraformIcon = (((_b = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _b === void 0 ? void 0 : _b.stderr) == '' && ((_c = terraform === null || terraform === void 0 ? void 0 : terraform.initLog) === null || _c === void 0 ? void 0 : _c.stderr) == '') ? 'success' : 'failure';
    const terraformContent = `\n## <sup>Terraform Processing &nbsp; <sub><sub><img height="22" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/${terraformIcon}.png" /><sub><sub><sup>\n
<details>
<summary>Terraform Log</summary>
<br>Output<br>
&nbsp;

${CODE_BLOCK}\n
${(_d = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _d === void 0 ? void 0 : _d.stdout}\n
${CODE_BLOCK}\n
Errors\n
${CODE_BLOCK}\n
${(_f = (_e = terraform === null || terraform === void 0 ? void 0 : terraform.log) === null || _e === void 0 ? void 0 : _e.stderr) !== null && _f !== void 0 ? _f : terraform.initLog.stderr}\n
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
        risksTable +
        `<details open="true">\n` +
        (((_g = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _g === void 0 ? void 0 : _g.length) > 0 ? riskAnalysisContent : 'No Risks Found\n') +
        terraformContent +
        `</details>\n` +
        `*Pusher: @${github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.actor}, Action: \`${github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.eventName}\`, Working Directory: \'${githubWorkspace}\', Workflow: \'${github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.workflow}\'*`;
    return markdownOutput;
}
function pollRiskAnalysisResponse() {
    return __awaiter(this, void 0, void 0, function* () {
        let analysisResult = yield checkRiskAnalysisResponse();
        for (let i = 0; i < 50; i++) {
            yield wait(3000);
            analysisResult = yield checkRiskAnalysisResponse();
            (0, core_1.info)('Response: ' + JSON.stringify(analysisResult));
            if (analysisResult)
                break;
        }
        return analysisResult;
    });
}
function wait(ms = 1000) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            console.log(`waiting ${ms} ms...`);
            setTimeout(resolve, ms);
        });
    });
}
function checkRiskAnalysisResponse() {
    return __awaiter(this, void 0, void 0, function* () {
        const pollUrl = `${apiUrl}?customer=${github_1.context.repo.owner}&action_id=${actionUuid}`;
        const response = JSON.parse(yield (yield http.get(pollUrl)).readBody());
        if (response.message_found) {
            return JSON.parse(response.result);
        }
        else {
            return null;
        }
    });
}
function uploadFile(json) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = false;
        if (json) {
            const ans = yield uploadToS3(actionUuid, JSON.stringify(json));
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
                        (0, core_1.debug)(`stdout: ${res.stdout}`);
                    },
                    stderr(data) {
                        res.stderr += data.toString();
                        (0, core_1.debug)(`stderr: ${res.stderr}`);
                    },
                },
            });
            res.code = code;
            return res;
        }
        catch (err) {
            const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
            (0, core_1.debug)(`@actions/exec.exec() threw an error: ${msg}`);
            throw new Error(msg);
        }
    });
}
function uploadToS3(keyName, body, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, core_1.debug)(`got the following bucket name ${bucketName}`);
        const s3 = new AWS.S3();
        const objectParams = {
            Bucket: s3Dest,
            ACL: 'bucket-owner-full-control',
            Body: body,
            Key: 'tmp' + keyName + '.out',
            Metadata: { customer: github_1.context.repo.owner, action_id: actionUuid }
        };
        return s3.putObject(objectParams).promise();
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const steps = {};
            steps.cloneRepo = yield exec('gh', ['repo', 'clone', github_1.context.repo.owner + '/' + github_1.context.repo.repo, githubWorkspace]);
            process.chdir(githubWorkspace);
            steps.pr = yield exec('gh', ['pr', 'checkout', github_1.context.payload.pull_request.number.toString()]);
            const diffs = yield changedFolders();
            if ((diffs === null || diffs === void 0 ? void 0 : diffs.length) == 0) {
                (0, core_1.info)('No changes were found in terraform plans');
                return;
            }
            (0, core_1.info)('Step 1 - Diffs Result: ' + JSON.stringify(diffs));
            const terraformResult = yield terraform(diffs[0]);
            (0, core_1.info)('Step 2 - Terraform Result: ' + JSON.stringify(terraformResult));
            let analysisResult;
            // terraformResult.plan = s3FileMock 
            if (uploadFile(terraformResult.plan)) {
                (0, core_1.info)('Step 3 - File Uploaded to S3 Successfully');
                analysisResult = yield pollRiskAnalysisResponse();
                // let analysisResult = riskAnalysisMock
            }
            (0, core_1.info)('Step 4 - Risk Analysis Result: ' + JSON.stringify(analysisResult));
            const risks = analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.additions;
            const commentBody = parseRiskAnalysis(risks, terraformResult);
            // git.createComment(commentBody , octokit, context)
            steps.comment = yield exec('gh', ['pr', 'comment', github_1.context.payload.pull_request.number.toString(), '-b', commentBody]);
            if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.success) {
                (0, core_1.info)('Step 5 - Parsing Risk Analysis');
                if (risks === null || risks === void 0 ? void 0 : risks.analysis_state) {
                    (0, core_1.info)('Step 6 - The risks analysis process completed successfully without any risks');
                    return;
                }
                else {
                    (0, core_1.setFailed)('The risks analysis process completed successfully with risks, please check report');
                }
            }
            else {
                let errors = '';
                Object.keys(steps).forEach(step => errors += steps[step].stderr);
                (0, core_1.setFailed)('The risks analysis process completed with errors:\n' + errors);
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}
run();
