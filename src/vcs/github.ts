import { GitHub } from "@actions/github/lib/utils"
import {context, getOctokit} from '@actions/github'
import {info, error, debug, setFailed as exit} from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {IVersionControl } from "./vcs.model"
import {WebhookPayload} from '@actions/github/lib/interfaces'
import {exec, ExecOutput} from "@actions/exec"
import {ExecSteps, AnalysisFile} from "../common/exec"
import {severityOrder} from "../common/risk.model"

export type GithubContext = typeof context
const getUuid = require('uuid-by-string')
// DEBUG LOCALLY
// import {githubEventPayloadMock } from "../mockData"
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
  steps: ExecSteps = {}
  workDir: string
  actionUuid: string
  fileTypes: string[]
  

  constructor(){
    this.http = new HttpClient()
    this.logger = {info, error, debug, exit}
    this.workspace = process?.env?.GITHUB_WORKSPACE
    this.token =  process?.env?.GITHUB_TOKEN 
    this.sha =  process?.env?.GITHUB_SHA 
    this._context = context
    this.octokit = getOctokit(this.token)
    this.payload = this._context?.payload
    this.repo = this._context.repo
    this.pullRequest = this._context.payload.pull_request.number.toString()
    this.workDir = this.workspace + '_ALGOSEC_CODE_ANALYSIS'
    this.actionUuid = getUuid(this.sha)

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
    const result = await this.octokit.rest.issues.createComment({
      ...this._context.repo,
      issue_number: this._context.issue.number,
      body
    });

      return {
        exitCode: result?.data?.body ? 0 : 1, 
        stdout: result?.data?.body ? result?.data?.body : null,
        stderr: result?.data?.body ? null : result?.data?.body,
      } as ExecOutput
  }

  buildAnalysisBody(analysis, file: AnalysisFile) {
    const analysisBody = `<details>\n${this.buildReportResult(analysis, file)}\n${this.buildFrameworkResult(file)}\n</details>`
    return analysisBody
  }

  buildReportResult(analysis, file){
    let risksList = '' 
    const CODE_BLOCK = '```';
    analysis?.analysis_result
                    .sort((a,b) => parseInt(severityOrder[a.riskSeverity]) - parseInt(severityOrder[b.riskSeverity]))
                    .forEach(risk => {
      risksList +=
`<details>\n
<summary><img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${risk.riskSeverity}.svg" />  ${risk.riskId} | ${risk.riskTitle}</summary> \n
### **Description:**\n${risk.riskDescription}\n
### **Recommendation:**\n${risk.riskRecommendation.toString()}\n
### **Details:**\n
${CODE_BLOCK}\n
${JSON.stringify(risk.items, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`
})
    const codeAnalysisContent = 
`<summary>Risks Report | ${file.folder}</summary>\n
${risksList}\n
<details>
<summary>Logs</summary>
<br>Output<br>

${CODE_BLOCK}\n
${JSON.stringify(analysis?.analysis_result, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`
    return analysis?.analysis_result?.length > 0 ? codeAnalysisContent : '\n### No Risks Found\n'
  }

  buildFrameworkResult(file){
    const CODE_BLOCK = '```';
    const frameworkIcon = (file?.output?.log?.stderr == '' ) ? 'V' : 'X'
    const frameworkContent = `\n<img height="50" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/Terraform${frameworkIcon}.svg" />\n
<details>
<summary>Terraform Log</summary>
<br>Output<br>

${CODE_BLOCK}\n
${file?.output?.log?.stdout}\n
${CODE_BLOCK}\n
Errors\n
${CODE_BLOCK}\n
${file?.output?.log?.stderr ?? file?.output?.initLog?.stderr}\n
${CODE_BLOCK}\n
</details> <!-- End Format Logs -->\n`
    return frameworkContent
  }

  buildSummaryTable(filesToUpload, results){
    const tableBody = ''
    let risksTableContents = ''
    const riskArrays = results
        .filter(result => result?.additions?.analysis_result?.length > 0)
        .map(result => {
          const folder = filesToUpload.find(file => result?.proceeded_file?.includes(file.uuid)).folder
          return result?.additions?.analysis_result.map(risk => { return {folder, ...risk}})
        })



    const mergedRisks = [].concat.apply([], riskArrays).sort((a,b) => parseInt(severityOrder[a.riskSeverity]) - parseInt(severityOrder[b.riskSeverity]));   
    mergedRisks.forEach(risk => {
        risksTableContents +=   
`<tr>\n
<td><img width="10" height="10" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/${risk.riskSeverity}.png" /> ${risk.riskSeverity.charAt(0).toUpperCase() + risk.riskSeverity.slice(1)}</td>\n
<td>AWS</td>\n
<td>${risk.folder}</td>\n
<td>${risk.riskId}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`
})

    const risksTable = `<table>\n
<thead>\n
<tr>\n
<th align="left" scope="col">Severity</th>\n
<th align="left" scope="col">Vendor</th>\n
<th align="left" scope="col">Folder</th>\n
<th align="left" scope="col">Risk ID</th>\n
<th align="left" scope="col">Summary</th>\n
</tr>\n
</thead>\n
<tbody id="tableBody">\n
${risksTableContents}                 
</tbody>
</table>\n`
    return results.some(result => result?.additions?.analysis_result?.length > 0) ? risksTable : ''
  }

  parseCodeAnalysis(filesToUpload, analysisResults) {
    const commentBodyArray = []
    const header = `<img height="50" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/RiskAnalysisV.svg" /> \n`
    const footer = `<br>
\n
*Pusher: @${this._context?.actor}, Action: \`${this._context?.eventName}\`, Working Directory: \'${this.workspace}\', Workflow: \'${this._context?.workflow }\'*` 
    const summaryTable = this.buildSummaryTable(filesToUpload, analysisResults)
    

    analysisResults.forEach(folderAnalysis => 
      commentBodyArray.push((!folderAnalysis?.additions) ? 
      '' : this.buildAnalysisBody(folderAnalysis?.additions, filesToUpload.find(file => folderAnalysis?.proceeded_file?.includes(file.uuid)))))
    const analysisByFolder = commentBodyArray.join(`\n\n---\n\n`)
    return header + summaryTable + `\n\n---\n\n` + analysisByFolder + footer
  }

  getRepoRemoteUrl(): string {
    return `https://${this.repo.owner}:${this.token}@github.com/${this.repo.owner}/${this.repo.repo}.git`
  }


  async fetch(
    additionalGitOptions: string[] = [],
): Promise<ExecOutput> {
    debug(`Executing 'git fetch' for branch '${additionalGitOptions}' with token and options `);
    const args = ['fetch', ...additionalGitOptions]
 
    return this.cmd(args);
}

  async clone(
    baseDirectory: string
): Promise<ExecOutput> {
    debug(`Executing 'git clone' to directory '${baseDirectory}' with token and options `);

    const remote = this.getRepoRemoteUrl();
    let args = ['clone', remote, baseDirectory];
    

    return this.cmd(args);
}
 async  checkout(
    ghRef: string,
    additionalGitOptions: string[] = [],
    ...options: string[]
): Promise<ExecOutput> {
    debug(`Executing 'git checkout' to ref '${ghRef}' with token and options '${options.join(' ')}'`);

    let args = ['checkout', ghRef];
    // if (options.length > 0) {
    //     args = args.concat(options);
    // }

    return this.cmd(args);
}

 async cmd(additionalGitOptions: string[], ...args: string[]): Promise<ExecOutput> {
  debug(`Executing Git: ${args.join(' ')}`);

  const res = await this.capture('git', additionalGitOptions);
  if (res.exitCode !== 0) {
      throw new Error(`Command 'git ${args.join(' ')}' failed: ${JSON.stringify(res)}`);
  }
  return res;
}

async capture(cmd: string, args: string[]): Promise<ExecOutput> {
  const res: ExecOutput = {
      stdout: '',
      stderr: '',
      exitCode: null
  };

  try {
      const code = await exec(cmd, args, {
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
  } catch (err) {
      const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
      debug(`@actions/exec.exec() threw an error: ${msg}`);
      throw new Error(msg);
  }
}


async prepareRepo(){
  this.steps.gitClone = await this.clone(this.workDir) //await exec('git' , ['clone', this.getRepoRemoteUrl(), this.workDir])
  process.chdir(this.workDir)
  this.steps.gitFetch = await this.fetch(['origin', `pull/${this.pullRequest}/head:${this.actionUuid}`]) //await exec('git' , ['fetch', 'origin', `pull/${this.pullRequest}/head:${this.actionUuid}`])
  this.steps.gitCheckout = await this.checkout(this.actionUuid) //await exec('git' , ['checkout', this.actionUuid])
}
   
async checkForDiffByFileTypes(fileTypes: string[]) {
  await this.prepareRepo()
  let diffFolders = []
  try {
      const diffs = await this.getDiff(this.octokit)
      const foldersSet = new Set(diffs
        .filter(diff => fileTypes?.some(fileType => diff?.filename?.endsWith(fileType)))
        .map(diff => diff?.filename.split('/')[0]))
      diffFolders = [...foldersSet]
  } catch (error: unknown) {
    if (error instanceof Error) this.logger.exit(error?.message)
  }
  if (diffFolders?.length == 0) {
    this.logger.info('##### Algosec ##### No changes were found in terraform plans')
      return
    }
    this.logger.info('##### Algosec ##### Step 1 - diffs result: ' + JSON.stringify(diffFolders))
  return diffFolders
}

async parseOutput(filesToUpload, analysisResults){
  const body = this.parseCodeAnalysis(filesToUpload, analysisResults)
  if (body && body != '') this.steps.comment = await this.createComment(body)
  if (analysisResults?.some(response => !response?.success)) {
    let errors = ''
    // Object.keys(this.steps).forEach(step => errors += this?.steps[step]?.stderr ?? '')
    this.logger.exit('##### Algosec ##### The risks analysis process failed.\n' + errors)
  } else {
    this.logger.info('##### Algosec ##### Step 5 - parsing Code Analysis')
    if (analysisResults?.some(response => response?.additions?.analysis_result?.length > 0)) {
      this.logger.exit('##### Algosec ##### The risks analysis process completed successfully with risks, please check report')
    } else {
      this.logger.info('##### Algosec ##### Step 6 - the risks analysis process completed successfully without any risks')
      return
    }
  }
}

getInputs() {
  return process.env
}

async uploadAnalysisFile(file: AnalysisFile, jwt: string): Promise<any> {
  const http = new HttpClient()
  const body = JSON.stringify(file?.output?.plan)
  const getPresignedUrl = `${process?.env?.CF_API_URL}/presignedurl?actionId=${file?.uuid}&owner=${context?.repo?.owner}&folder=${file?.folder}`
  const presignedUrlResponse = await (await http.get(getPresignedUrl, {'Authorization': `Bearer ${jwt}`})).readBody()
  const presignedUrl = JSON.parse(presignedUrlResponse).presignedUrl
  const response = await (await http.put(presignedUrl, body, {'Content-Type':'application/json'})).readBody()
  if (response == ''){
    return true
  } else {
    exit(response)
  }

}


  


}




