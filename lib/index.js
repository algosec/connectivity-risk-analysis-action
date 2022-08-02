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
// import {githubEventPayload} from './pull-request'
// import { s3File } from '../test-repo/tmp/tf.json'
// context.payload = githubEventPayload as WebhookPayload & any
// const ghToken =  process?.env?.GITHUB_TOKEN ?? getInput('GITHUB_TOKEN')
// const ghSha =  process?.env?.GITHUB_SHA ?? getInput('GITHUB_SHA')
// const githubWorkspace =  process.cwd() + '\\' + process?.env?.GITHUB_WORKSPACE ?? getInput('GITHUB_WORKSPACE')
// const githubRepoOwner  =  process?.env?.GITHUB_REPOSITORY_OWNER ?? getInput('GITHUB_REPOSITORY_OWNER')
// const tfToken = process?.env?.TF_API_TOKEN ?? getInput('TF_API_TOKEN')
// const apiUrl = process.env.RA_API_URL ?? getInput('RA_API_URL')
// const s3Dest = process?.env?.AWS_S3 ?? getInput('AWS_S3')
const ghToken = (0, core_1.getInput)('GITHUB_TOKEN');
const ghSha = (0, core_1.getInput)('GITHUB_SHA');
const githubWorkspace = (0, core_1.getInput)('GITHUB_WORKSPACE');
const githubRepoOwner = (0, core_1.getInput)('GITHUB_REPOSITORY_OWNER');
const tfToken = (0, core_1.getInput)('TF_API_TOKEN');
const apiUrl = (0, core_1.getInput)('RA_API_URL');
const s3Dest = (0, core_1.getInput)('AWS_S3');
const actionUuid = generateTmpFileUuid();
const http = new http_client_1.HttpClient();
// const tfHost =  getInput('TF_HOST') //process?.env?.TF_HOST ?? getInput('TF_HOST')
// const awsAccessKeyId = getInput('AWS_ACCESS_KEY_ID') // process?.env?.AWS_ACCESS_KEY_ID ?? 
// const awsSecretAccessKey = getInput('AWS_SECRET_ACCESS_KEY') // process?.env?.AWS_SECRET_ACCESS_KEY ?? 
function changedFiles(octokit, context, git) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let diffFolders;
        try {
            if (octokit && ((_a = context === null || context === void 0 ? void 0 : context.payload) === null || _a === void 0 ? void 0 : _a.pull_request)) {
                const diffs = yield git.getDiff(octokit, context);
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
function terraform(diffs, tfToken = '') {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const diffPromises = []
            if (tfToken) {
                // diffs.filter(diff => diff !== 'tf-test-sg').forEach(diff =>  diffPromises.push(exec('sh', ['tf-run.sh', `${process?.cwd()}`, githubWorkspace, diff])))
                process.chdir(`${githubWorkspace}/${diffs[0]}`);
                const init = yield exec('terraform', ['init']);
                const fmt = yield exec('terraform', ['fmt', '-diff']);
                const validate = yield exec('terraform', ['validate', '-no-color']);
                if (!(0, fs_1.existsSync)('./tmp')) {
                    yield exec('mkdir', ['tmp']);
                }
                const plan = yield exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf.out`]);
                const terraformLog = init.stdout.concat(fmt.stdout, validate.stdout, init.stdout);
                let jsonPlan = {};
                if (plan.stdout) {
                    jsonPlan = JSON.parse((yield exec('terraform', ['show', '-json', `${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf.out`])).stdout);
                }
                process.chdir(`${githubWorkspace}`);
                return { plan: jsonPlan, log: plan.stdout };
                // await Promise.all(diffPromises)
                // await terraform.show()
            }
        }
        catch (error) {
            if (error instanceof Error)
                console.log(error.message); //setFailed(error.message)
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const octokit = (0, github_1.getOctokit)(ghToken);
            const git = new git_1.GitProcessorExec();
            // await loginToAws();
            const diffs = yield changedFiles(octokit, github_1.context, git);
            if ((diffs === null || diffs === void 0 ? void 0 : diffs.length) == 0) {
                return;
            }
            (0, core_1.info)('Step 1 - Diffs Result: ' + JSON.stringify(diffs));
            const terraformResult = yield terraform(diffs, tfToken);
            (0, core_1.info)('Step 2 - Terraform Result: ' + JSON.stringify(terraformResult));
            let analysisResult;
            // const fileToUpload = s3File 
            if (uploadFile(terraformResult.plan)) {
                (0, core_1.info)('Step 3 - File Uploaded to S3 Successfully');
                analysisResult = yield pollRiskAnalysisResponse();
            }
            (0, core_1.info)('Step 4 - Risk Analysis Result: ' + JSON.stringify(analysisResult));
            if (analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.success) {
                const risks = analysisResult === null || analysisResult === void 0 ? void 0 : analysisResult.additions;
                if (risks === null || risks === void 0 ? void 0 : risks.analysis_state) {
                    (0, core_1.info)('Step 5 - The risks analysis process completed successfully without any risks');
                    git.createComment('Risk Analysis Completed, no risks were found', octokit, github_1.context);
                    return;
                }
                else {
                    (0, core_1.info)('Step 6 - Parsing Report');
                    const commentBody = parseRiskAnalysis(risks, terraformResult);
                    git.createComment(commentBody, octokit, github_1.context);
                    (0, core_1.setFailed)('The risks analysis process completed successfully with risks, please check report');
                }
            }
            else {
                (0, core_1.setFailed)('The risks analysis process completed with errors');
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}
function parseRiskAnalysis(analysis, terraform) {
    const body = parseToGithubSyntax(analysis, terraform);
    return body;
}
function parseToGithubSyntax(analysis, terraform) {
    var _a;
    const CODE_BLOCK = '```';
    const output = `## ![alt text](https://raw.githubusercontent.com/alonnalgo/action-test/main/algosec_logo.png "Connectivity Risk Analysis") ${analysis.analysis_state ? ':heavy_check_mark:' : ':x:'}  Connectivity Risk Analysis :cop:
<details open="true">
<summary>Report</summary>
${'ANALYSIS REPORT'}
</details>`
        +
            ((_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result) === null || _a === void 0 ? void 0 : _a.forEach(risk => {
                return;
                `<details open="true">
<summary>${risk.riskSeverity}  ${risk.riskId}</summary>
${risk.riskTitle}
###### Description: ${risk.riskDescription}
###### Recommendation: ${risk.riskRecommendation}
###### Details:
${CODE_BLOCK}
${risk.items}
${CODE_BLOCK}`;
            }))
        +
            `<details>
<summary>Logs</summary>
Output
${CODE_BLOCK}json
${analysis === null || analysis === void 0 ? void 0 : analysis.analysis_result}
${CODE_BLOCK}

Errors
${CODE_BLOCK}
${'env.analysis_err'}
${CODE_BLOCK}
</details>
## ${terraform.log.stdout ? ':heavy_check_mark:' : ':x:'} Terraform Processing ⚙️
<details><summary>Terraform Log</summary>
Output
${CODE_BLOCK}
${terraform.log.stdout}
${CODE_BLOCK}
Errors
${CODE_BLOCK}
${terraform.log.stderr}
${CODE_BLOCK}
</details> <!-- End Format Logs -->
*Pusher: @${github_1.context.actor}, Action: \`${github_1.context.eventName}\`, Working Directory: \'${'env.tf_actions_working_dir'}\', Workflow: \'${github_1.context.workflow}\'*`;
    return output;
}
function pollRiskAnalysisResponse() {
    return __awaiter(this, void 0, void 0, function* () {
        let analysisResult = yield checkRiskAnalysisResponse();
        for (let i = 0; i < 50; i++) {
            yield wait(3000);
            analysisResult = yield checkRiskAnalysisResponse();
            (0, core_1.info)('Response: \n' + JSON.stringify(analysisResult));
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
        const pollUrl = `${apiUrl}?customer=${githubRepoOwner}&action_id=${actionUuid}`;
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
function generateTmpFileUuid() {
    const uuid = getUuid(ghSha);
    return uuid;
}
function createTmpFile(json) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, fs_1.writeFileSync)(`${githubWorkspace}\\tmp\\tf.json.out`, JSON.stringify(json));
        (0, core_1.info)('File was created successfully');
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
            // info(`EXEC RESPONSE: ${JSON.stringify(res)}`)
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
            Metadata: { customer: githubRepoOwner, action_id: actionUuid }
        };
        return s3.putObject(objectParams).promise();
    });
}
run();
