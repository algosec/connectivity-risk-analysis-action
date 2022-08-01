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
exports.GitProcessorExec = void 0;
const exec_1 = require("../common/exec");
const github_1 = require("@actions/github");
const core = __importStar(require("@actions/core"));
class GitProcessorExec extends exec_1.Exec {
    getDiff(octokit, context) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield octokit.rest.repos.compareCommits({
                repo: context.repo.repo,
                owner: context.repo.owner,
                head: (_b = (_a = context === null || context === void 0 ? void 0 : context.payload) === null || _a === void 0 ? void 0 : _a.pull_request) === null || _b === void 0 ? void 0 : _b.head.sha,
                base: (_d = (_c = context === null || context === void 0 ? void 0 : context.payload) === null || _c === void 0 ? void 0 : _c.pull_request) === null || _d === void 0 ? void 0 : _d.base.sha,
                per_page: 100
            });
            const answer = result.data.files || [];
            // console.log(JSON.stringify(answer, undefined, 2))
            return answer;
        });
    }
    createComment(_comment, octokit, context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield octokit.rest.issues.createComment(Object.assign(Object.assign({}, context.repo), { issue_number: context.issue.number, body: _comment }));
        });
    }
    cmd(additionalGitOptions, context, ...args) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Executing Git: ${args.join(' ')}`);
            const serverUrl = this.getServerUrl((_a = context.payload.repository) === null || _a === void 0 ? void 0 : _a.html_url);
            const userArgs = [
                ...additionalGitOptions,
                '-c',
                'user.email=alon.noy@algosec.com',
                '-c',
                `http.${serverUrl}/.extraheader=`, // This config is necessary to support actions/checkout@v2 (#9)
            ];
            const res = yield this.capture('git', userArgs.concat(args));
            if (res.code !== 0) {
                throw new Error(`Command 'git ${args.join(' ')}' failed: ${JSON.stringify(res)}`);
            }
            return res.stdout;
        });
    }
    fetch(token, branch, additionalGitOptions = [], ...options) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Executing 'git fetch' for branch '${branch}' with token and options '${options.join(' ')}'`);
            const remote = token !== undefined ? this.getCurrentRepoRemoteUrl(token) : 'origin';
            let args = ['fetch', remote, `${branch}:${branch}`];
            if (options.length > 0) {
                args = args.concat(options);
            }
            return this.cmd(additionalGitOptions, github_1.context, ...args);
        });
    }
    getCurrentRepoRemoteUrl(token) {
        var _a;
        const { repo, owner } = github_1.context.repo;
        const serverName = this.getServerName((_a = github_1.context.payload.repository) === null || _a === void 0 ? void 0 : _a.html_url);
        return this.getRepoRemoteUrl(token, `${serverName}/${owner}/${repo}`);
    }
    getRepoRemoteUrl(token, repoUrl) {
        return `https://x-access-token:${token}@${repoUrl}.git`;
    }
    getServerName(repositoryUrl) {
        const urlObj = repositoryUrl ? new URL(repositoryUrl) : new URL(GitProcessorExec.DEFAULT_GITHUB_URL);
        return repositoryUrl ? urlObj.hostname : GitProcessorExec.DEFAULT_GITHUB_URL.replace('https://', '');
    }
    clone(token, context, baseDirectory, additionalGitOptions = [], ...options) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Executing 'git clone' to directory '${baseDirectory}' with token and options '${options.join(' ')}'`);
            const remote = this.getRepoRemoteUrl(token, this.getServerName(undefined) + '/' + context.repo.owner + '/' + context.repo.repo);
            let args = ['clone', remote, baseDirectory];
            if (options.length > 0) {
                args = args.concat(options);
            }
            return this.cmd(additionalGitOptions, context, ...args);
        });
    }
    checkout(ghRef, additionalGitOptions = [], ...options) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Executing 'git checkout' to ref '${ghRef}' with token and options '${options.join(' ')}'`);
            let args = ['checkout', ghRef];
            if (options.length > 0) {
                args = args.concat(options);
            }
            return this.cmd(additionalGitOptions, github_1.context, ...args);
        });
    }
    getServerUrl(repositoryUrl) {
        const urlObj = repositoryUrl ? new URL(repositoryUrl) : new URL(GitProcessorExec.DEFAULT_GITHUB_URL);
        return repositoryUrl ? urlObj.origin : GitProcessorExec.DEFAULT_GITHUB_URL;
    }
}
exports.GitProcessorExec = GitProcessorExec;
GitProcessorExec.DEFAULT_GITHUB_URL = 'https://github.com';
