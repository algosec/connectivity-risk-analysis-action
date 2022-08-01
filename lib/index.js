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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const git_1 = require("./vcs/git");
const pull_request_1 = require("./pull-request");
require("dotenv/config");
const exec_1 = require("@actions/exec");
github_1.context.payload = pull_request_1.githubEventPayload;
const ghToken = (_b = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.GITHUB_TOKEN) !== null && _b !== void 0 ? _b : (0, core_1.getInput)('GITHUB_TOKEN');
const githubWorkspace = (_d = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.GITHUB_WORKSPACE) !== null && _d !== void 0 ? _d : (0, core_1.getInput)('GITHUB_WORKSPACE');
const tfToken = (_f = (_e = process === null || process === void 0 ? void 0 : process.env) === null || _e === void 0 ? void 0 : _e.TF_API_TOKEN) !== null && _f !== void 0 ? _f : (0, core_1.getInput)('TF_API_TOKEN');
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
                // diffs.filter(diff => diff !== 'tf-test-sg').forEach(diff =>  diffPromises.push(capture('sh', ['tf-run.sh', `${process?.cwd()}`, githubWorkspace, diff])))
                process.chdir(`${githubWorkspace}/${diffs[0]}`);
                yield capture('terraform', ['init']);
                yield capture('terraform', ['fmt', '-diff']);
                yield capture('terraform', ['validate', '-no-color']);
                yield capture('terraform', ['plan', '-input=false', '-no-color', `-out=${githubWorkspace}\\tf.out`]);
                process.chdir(`${githubWorkspace}`);
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
            // info(JSON.stringify(diffs))
            yield capture('ls', []);
            // await git.clone(ghToken, context, './common')
            // await git.checkout(context.payload.pull_request.base.sha)
            yield terraform(diffs, tfToken);
            // git.createComment('Action Works !!!', octokit, context)
        }
        catch (error) {
            console.log(error);
        }
    });
}
function capture(cmd, args) {
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
                        (0, core_1.debug)(`stdout: ${res.stdout}`);
                    },
                    stderr(data) {
                        res.stderr += data.toString();
                        (0, core_1.info)(`stderr: ${res.stderr}`);
                        (0, core_1.debug)(`stderr: ${res.stderr}`);
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
run();
