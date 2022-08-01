import { GitHub } from "@actions/github/lib/utils"
import { GithubContext } from "../index"
import {Exec} from '../common/exec'
import {context} from '@actions/github'
import * as core from '@actions/core'
export class GitProcessorExec extends Exec {
  static DEFAULT_GITHUB_URL = 'https://github.com';

  async getDiff(octokit: InstanceType<typeof GitHub>, context: GithubContext) {

    const result = await octokit.rest.repos.compareCommits({
      repo: context.repo.repo,
      owner: context.repo.owner,
      head: context?.payload?.pull_request?.head.sha,
      base: context?.payload?.pull_request?.base.sha,
      per_page: 100
    })
    const answer = result.data.files || []
    // console.log(JSON.stringify(answer, undefined, 2))
    return answer


  }

  async createComment(_comment: string, octokit: InstanceType<typeof GitHub>, context: GithubContext){
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: context.issue.number,
            body: 'Thank you for submitting a pull request! We will try to review this as soon as we can.'
    });
  }

  async cmd(additionalGitOptions: string[], context: GithubContext, ...args: string[]): Promise<string> {
    core.debug(`Executing Git: ${args.join(' ')}`);
    const serverUrl = this.getServerUrl(context.payload.repository?.html_url);
    const userArgs = [
        ...additionalGitOptions,
        '-c',
        'user.email=alon.noy@algosec.com',
        '-c',
        `http.${serverUrl}/.extraheader=`, // This config is necessary to support actions/checkout@v2 (#9)
    ];
    const res = await this.capture('git', userArgs.concat(args));
    if (res.code !== 0) {
        throw new Error(`Command 'git ${args.join(' ')}' failed: ${JSON.stringify(res)}`);
    }
    return res.stdout;
  }

  async fetch(
    token: string | undefined,
    branch: string,
    additionalGitOptions: string[] = [],
    ...options: string[]
): Promise<string> {
    core.debug(`Executing 'git fetch' for branch '${branch}' with token and options '${options.join(' ')}'`);

    const remote = token !== undefined ? this.getCurrentRepoRemoteUrl(token) : 'origin';
    let args = ['fetch', remote, `${branch}:${branch}`];
    if (options.length > 0) {
        args = args.concat(options);
    }

    return this.cmd(additionalGitOptions, context, ...args);
}

  getCurrentRepoRemoteUrl(token: string): string {
    const { repo, owner } = context.repo;
    const serverName = this.getServerName(context.payload.repository?.html_url);
    return this.getRepoRemoteUrl(token, `${serverName}/${owner}/${repo}`);
  }

  getRepoRemoteUrl(token: string, repoUrl: string): string {
    return `https://x-access-token:${token}@${repoUrl}.git`;
  }

  getServerName(repositoryUrl: string | undefined): string {
    const urlObj = repositoryUrl ? new URL(repositoryUrl) : new URL(GitProcessorExec.DEFAULT_GITHUB_URL);
    return repositoryUrl ? urlObj.hostname : GitProcessorExec.DEFAULT_GITHUB_URL.replace('https://', '');
}

  
  async clone(
    token: string,
    context: GithubContext,
    baseDirectory: string,
    additionalGitOptions: string[] = [],
    ...options: string[]
): Promise<string> {
    core.debug(`Executing 'git clone' to directory '${baseDirectory}' with token and options '${options.join(' ')}'`);

    const remote = this.getRepoRemoteUrl(token, this.getServerName(undefined) + '/' + context.repo.owner + '/' + context.repo.repo);
    let args = ['clone', remote, baseDirectory];
    if (options.length > 0) {
        args = args.concat(options);
    }

    return this.cmd(additionalGitOptions, context, ...args);
    }
  
    async checkout(
    ghRef: string,
    additionalGitOptions: string[] = [],
    ...options: string[]
): Promise<string> {
    core.debug(`Executing 'git checkout' to ref '${ghRef}' with token and options '${options.join(' ')}'`);

    let args = ['checkout', ghRef];
    if (options.length > 0) {
        args = args.concat(options);
    }

    return this.cmd(additionalGitOptions, context, ...args);
    }
  
    getServerUrl(repositoryUrl: string | undefined): string {
    const urlObj = repositoryUrl ? new URL(repositoryUrl) : new URL(GitProcessorExec.DEFAULT_GITHUB_URL);
    return repositoryUrl ? urlObj.origin : GitProcessorExec.DEFAULT_GITHUB_URL;
    }



}




