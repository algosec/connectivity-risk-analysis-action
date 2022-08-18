import { GitHub } from "@actions/github/lib/utils"
import {context, getOctokit} from '@actions/github'
import {info, error, debug, setFailed as exit} from '@actions/core'
import {HttpClient} from '@actions/http-client'
import { IVersionControl } from "./vcs.model"
import {WebhookPayload} from '@actions/github/lib/interfaces'
// import { githubEventPayloadMock } from "../mockData"
export type GithubContext = typeof context

// DEBUG
// context.payload = githubEventPayloadMock as WebhookPayload & any

export class Github implements IVersionControl {
  workspace: string
  token: string
  sha: string
  octokit: InstanceType<typeof GitHub>
  static DEFAULT_GITHUB_URL = 'https://github.com'
  http: HttpClient
  logger
  private _context
  repo: any
  payload: WebhookPayload
  pullRequest: string

  constructor(){
    this.http = new HttpClient()
    this.logger = {info, error, debug, exit}
    this.workspace = process?.env?.GITHUB_WORKSPACE
    this.token =  process?.env?.GH_TOKEN 
    this.sha =  process?.env?.GITHUB_SHA 
    this._context = context
    this.octokit = getOctokit(this.token)
    this.payload = this._context?.payload
    this.repo = this._context.repo
    this.pullRequest = this._context.payload.pull_request.number.toString()
  }

  init(){
    return this
  }



  async getDiff(octokit: InstanceType<typeof GitHub>) {

    const result = await octokit.rest.repos.compareCommits({
      repo: this._context.repo.repo,
      owner: this._context.repo.owner,
      head: this._context?.payload?.pull_request?.head.sha,
      base: this._context?.payload?.pull_request?.base.sha,
      per_page: 100
    })
    const answer = result.data.files || []
    return answer


  }

  async createComment(body){
    await this.octokit.rest.issues.createComment({
      ...this._context.repo,
      issue_number: this._context.issue.number,
      body
    });
  }

  convertToMarkdown(analysis, terraform) {
    
    const CODE_BLOCK = '```';

    let risksList = '' 
    let risksTableContents = ''
    analysis?.analysis_result?.forEach(risk => {
    risksList +=
    `<details open="true">\n
<summary><img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${risk.riskSeverity}.png" />  ${risk.riskId} | ${risk.riskTitle}</summary> \n
### **Description:**\n${risk.riskDescription}\n
### **Recommendation:**\n${risk.riskRecommendation.toString()}\n
### **Details:**\n
${CODE_BLOCK}\n
${JSON.stringify(risk.items, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`

risksTableContents +=   
`<tr>\n
<td>${risk.riskId}</td>\n
<td><img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${risk.riskSeverity}.png" /> ${risk.riskSeverity.charAt(0).toUpperCase() + risk.riskSeverity.slice(1)}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`


    })
    const analysisIcon = analysis?.analysis_state ? 'V' : 'X'
    const header = `<img height="50" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/RiskAnalysis${analysisIcon}.svg" /> \n`
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
</table>\n`
    const terraformIcon = (terraform?.log?.stderr == '' ) ? 'V' : 'X'
    const terraformContent = `\n<img height="50" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/Terraform${terraformIcon}.svg" />\n
<details>
<summary>Terraform Log</summary>
<br>Output<br>
&nbsp;

${CODE_BLOCK}\n
${terraform?.log?.stdout}\n
${CODE_BLOCK}\n
Errors\n
${CODE_BLOCK}\n
${terraform?.log?.stderr ?? terraform?.initLog?.stderr}\n
${CODE_BLOCK}\n
</details> <!-- End Format Logs -->\n`
    const codeAnalysisContent = `<summary>Report</summary>\n
${risksList}\n
<details>
<summary>Logs</summary>
<br>Output<br>
&nbsp;

${CODE_BLOCK}\n
${JSON.stringify(analysis?.analysis_result, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`

  const markdownOutput = 
    header +
    (analysis?.analysis_result?.length > 0 ? risksTable : '') + 
   `<details open="true">\n` +
    (analysis?.analysis_result?.length > 0 ? codeAnalysisContent : '\n### No Risks Found\n') +
    terraformContent +
    `</details><br>
\n
*Pusher: @${this._context?.actor}, Action: \`${this._context?.eventName}\`, Working Directory: \'${this.workspace}\', Workflow: \'${this._context?.workflow }\'*`
  

  return markdownOutput
  }

  parseCodeAnalysis(filesToUpload, analysisResult) {
    const commentBodyArray = []
    analysisResult.forEach(folderAnalysis => 
      commentBodyArray.push((!folderAnalysis?.additions) ? 
      '' : this.convertToMarkdown(folderAnalysis?.additions, filesToUpload.find(file => folderAnalysis?.proceeded_file?.includes(file.uuid)))))
    return commentBodyArray.join('<br><br><br>')
  }

  // getCurrentRepoRemoteUrl(token: string): string {
  //   const { repo, owner } = this._context.repo;
  //   const serverName = this.getServerName(this._context.payload.repository?.html_url);
  //   return this.getRepoRemoteUrl(token, `${serverName}/${owner}/${repo}`);
  // }

  getRepoRemoteUrl(): string {
    // return `https://x-access-token:${token}@${repoUrl}.git`;
    return `https://${this.repo.owner}:${this.token}@github.com/${this.repo.owner}/${this.repo.repo}.git`
  }

  getServerName(repositoryUrl: string | undefined): string {
    const urlObj = repositoryUrl ? new URL(repositoryUrl) : new URL(Github.DEFAULT_GITHUB_URL);
    return repositoryUrl ? urlObj.hostname : Github.DEFAULT_GITHUB_URL.replace('https://', '');
}

  
  async clone(
    token: string,
    context: GithubContext,
    baseDirectory: string,
    additionalGitOptions: string[] = [],
    ...options: string[]
): Promise<string> {
    debug(`Executing 'git clone' to directory '${baseDirectory}' with token and options '${options.join(' ')}'`);

    const remote = this.getRepoRemoteUrl();
    let args = ['clone', remote, baseDirectory];
    if (options.length > 0) {
        args = args.concat(options);
    }

    // return this.cmd(additionalGitOptions, context, ...args);
    return Promise.resolve('')
    }
  
    async checkout(
    ghRef: string,
    additionalGitOptions: string[] = [],
    ...options: string[]
): Promise<string> {
    debug(`Executing 'git checkout' to ref '${ghRef}' with token and options '${options.join(' ')}'`);

    let args = ['checkout', ghRef];
    if (options.length > 0) {
        args = args.concat(options);
    }

    // return this.cmd(additionalGitOptions, context, ...args);
    return Promise.resolve('')
    }
  
    getServerUrl(repositoryUrl: string | undefined): string {
    const urlObj = repositoryUrl ? new URL(repositoryUrl) : new URL(Github.DEFAULT_GITHUB_URL);
    return repositoryUrl ? urlObj.origin : Github.DEFAULT_GITHUB_URL;
    }



}




