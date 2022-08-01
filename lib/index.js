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
const pull_request_1 = require("./pull-request");
const exec_1 = require("@actions/exec");
const fs_1 = require("fs");
const AWS = __importStar(require("aws-sdk"));
// import { s3File } from '../test-repo/tmp/tf.json'
require("dotenv/config");
const getUuid = require('uuid-by-string');
github_1.context.payload = pull_request_1.githubEventPayload;
const ghToken = (0, core_1.getInput)('GITHUB_TOKEN'); //process?.env?.GITHUB_TOKEN ?? getInput('GITHUB_TOKEN')
const ghSha = (0, core_1.getInput)('GITHUB_SHA'); //process?.env?.GITHUB_SHA ?? getInput('GITHUB_SHA')
const githubWorkspace = (0, core_1.getInput)('GITHUB_WORKSPACE'); //process.cwd() + '\\' + process?.env?.GITHUB_WORKSPACE ?? getInput('GITHUB_WORKSPACE')
const githubRepoOwner = (0, core_1.getInput)('GITHUB_REPOSITORY_OWNER'); //process?.env?.GITHUB_REPOSITORY_OWNER ?? getInput('GITHUB_REPOSITORY_OWNER')
const tfToken = (0, core_1.getInput)('TF_API_TOKEN'); // process?.env?.TF_API_TOKEN ?? getInput('TF_API_TOKEN')
const apiUrl = (0, core_1.getInput)('RA_API_URL'); // process.env.RA_API_URL ?? getInput('RA_API_URL')
const s3Dest = (0, core_1.getInput)('AWS_S3'); // process?.env?.AWS_S3 ?? getInput('AWS_S3')
const actionUuid = generateTmpFileUuid();
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
            const diffPromises = [];
            if (tfToken) {
                // diffs.filter(diff => diff !== 'tf-test-sg').forEach(diff =>  diffPromises.push(exec('sh', ['tf-run.sh', `${process?.cwd()}`, githubWorkspace, diff])))
                process.chdir(`${githubWorkspace}/${diffs[0]}`);
                yield exec('terraform', ['init']);
                yield exec('terraform', ['fmt', '-diff']);
                yield exec('terraform', ['validate', '-no-color']);
                if (!(0, fs_1.existsSync)('./tmp')) {
                    yield exec('mkdir', ['tmp']);
                }
                const plan = yield exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf.out`]);
                let json = {};
                if (plan.stdout) {
                    json = JSON.parse((yield exec('terraform', ['show', '-json', `${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf.out`])).stdout);
                }
                process.chdir(`${githubWorkspace}`);
                return json;
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
            // await loginToAws();
            const git = new git_1.GitProcessorExec();
            // info(JSON.stringify(context))
            const diffs = yield changedFiles(octokit, github_1.context, git);
            if ((diffs === null || diffs === void 0 ? void 0 : diffs.length) == 0) {
                return;
            }
            (0, core_1.info)('Diffs: ' + JSON.stringify(diffs));
            const fileToUpload = yield terraform(diffs, tfToken);
            // const fileToUpload = s3File 
            let gotResponse;
            if (uploadFile(fileToUpload)) {
                gotResponse = yield pollRiskAnalysisResponse();
            }
            if (!!gotResponse) {
                parseRiskAnalysis(octokit, git);
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}
function parseRiskAnalysis(octokit, git) {
    return __awaiter(this, void 0, void 0, function* () {
        git.createComment('Risk Analysis Action Works !!!', octokit, github_1.context);
        return;
    });
}
function pollRiskAnalysisResponse() {
    return __awaiter(this, void 0, void 0, function* () {
        const http = new http_client_1.HttpClient();
        let hResult = yield checkRiskAnalysisResponse();
        for (let i = 0; i < 50; i++) {
            yield wait(5000);
            hResult = yield checkRiskAnalysisResponse();
            if (hResult)
                return hResult;
        }
        return hResult;
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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const http = new http_client_1.HttpClient();
        const pollUrl = `${apiUrl}?customer=${githubRepoOwner}&action_id=${actionUuid}`;
        let riskAnalysis = null;
        const { message_found, result } = JSON.parse(yield (yield http.get(pollUrl)).readBody());
        if (message_found) {
            riskAnalysis = JSON.parse(result);
            let analysis_result = false;
            if ((riskAnalysis === null || riskAnalysis === void 0 ? void 0 : riskAnalysis.success) && ((_a = riskAnalysis === null || riskAnalysis === void 0 ? void 0 : riskAnalysis.additions) === null || _a === void 0 ? void 0 : _a.analysis_state)) {
                analysis_result = true;
            }
            else {
                analysis_result = false;
            }
            if (analysis_result) {
                (0, core_1.info)('The analysis process was completed successfully: \n' + JSON.stringify(riskAnalysis));
                return riskAnalysis;
            }
            else {
                (0, core_1.setFailed)('The analysis process completed with error. Check report');
            }
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
                        (0, core_1.info)(`stdout: ${res.stdout}`);
                        // debug(`stdout: ${res.stdout}`);
                    },
                    stderr(data) {
                        res.stderr += data.toString();
                        (0, core_1.info)(`stderr: ${res.stderr}`);
                        // debug(`stderr: ${res.stderr}`);
                    },
                },
            });
            res.code = code;
            (0, core_1.info)(`EXEC RESPONSE: ${JSON.stringify(res)}`);
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
