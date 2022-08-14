import {info, setFailed } from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {HttpClient} from '@actions/http-client'
import {Github} from './vcs/github'
import { exec } from './common/exec'
import 'dotenv/config'
import {VersionControlService} from './vcs/vcs.service'
import {FrameworkKeys} from './iaas-tools/framework.model'
import {FrameworkService } from './iaas-tools/framework.service'
import { Aws } from './providers/aws'
import { VersionControlKeys } from './vcs/vcs.model'
const getUuid = require('uuid-by-string')

export type GithubContext = typeof context

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}
// import {WebhookPayload} from '@actions/github/lib/interfaces'
// import {githubEventPayloadMock, riskAnalysisMock, terraformPlanFileMock} from './mockData'
// context.payload = githubEventPayloadMock as WebhookPayload & any

export class RiskAnalysis{
  steps: {[name: string]: ExecResult} = {}
  ghToken =  process?.env?.GITHUB_TOKEN 
  debugMode =  process?.env?.ALGOSEC_DEBUG 
  ghSha =  process?.env?.GITHUB_SHA 
  apiUrl = process?.env?.RA_API_URL
  s3Dest = process?.env?.AWS_S3
  tenantId = process?.env?.TENANT_ID
  clientId = process?.env?.CF_CLIENT_ID
  clientSecret = process?.env?.CF_CLIENT_SECRET
  loginAPI = process?.env?.CF_LOGIN_API
  actionUuid = getUuid(this.ghSha)
  githubWorkspace =  process?.env?.GITHUB_WORKSPACE//+'_'+actionUuid
  http = new HttpClient()
  workDir = this.githubWorkspace+'_'+this.actionUuid
  frameworkType: FrameworkKeys = process?.env?.FRAMEWORK_TYPE as FrameworkKeys
  vcsType: VersionControlKeys = process?.env?.VCS_TYPE as VersionControlKeys
  fileType = process?.env?.FILE_TYPE
  
  constructor(){
  }
     
  async checkForDiff(fileType: string) {
    const octokit = getOctokit(this.ghToken)
    const git = new Github()
    let diffFolders
    try {
      if (octokit && context?.payload?.pull_request) {
        const diffs = await git.getDiff(octokit)
        const foldersSet = new Set(diffs
          .filter(diff => diff?.filename?.endsWith(fileType))
          .map(diff => diff?.filename.split('/')[0]))
        diffFolders = [...foldersSet]
      }
    } catch (error: unknown) {
      if (error instanceof Error) setFailed(error.message)
    }
    if (diffFolders?.length == 0) {
      info('##### Algosec ##### No changes were found in terraform plans')
        return
      }
      info('##### Algosec ##### Step 1 - Diffs Result: ' + JSON.stringify(diffFolders))
    return diffFolders
  }

  parseRiskAnalysis(analysis, terraform) {

      const CODE_BLOCK = '```';

      let risksList = '' 
      let risksTableContents = ''
      analysis?.analysis_result?.forEach(risk => {
      risksList +=
      `<details open="true">\n
<summary><img width="10" height="10" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/${risk.riskSeverity}.png" />  ${risk.riskId} | ${risk.riskTitle}</summary> \n
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
<td><img width="10" height="10" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/${risk.riskSeverity}.png" /> ${risk.riskSeverity.charAt(0).toUpperCase() + risk.riskSeverity.slice(1)}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`


      })
      const analysisIcon = analysis?.analysis_state ? 'V' : 'X'
      const header = `<img height="50" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/RiskAnalysis${analysisIcon}.svg" /> \n`
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
      const terraformContent = `\n<img height="50" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/Terraform${terraformIcon}.svg" />\n
<details>
<summary>Terraform Log</summary>
<br>Output<br>
&nbsp;

${CODE_BLOCK}\n
${terraform?.log?.stdout}\n
${CODE_BLOCK}\n
Errors\n
${CODE_BLOCK}\n
${terraform?.log?.stderr ?? terraform?.initLog.stderr}\n
${CODE_BLOCK}\n
  </details> <!-- End Format Logs -->\n`
      const riskAnalysisContent = `<summary>Report</summary>\n
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
      (analysis?.analysis_result?.length > 0 ? riskAnalysisContent : 'No Risks Found\n') +
      terraformContent +
      `</details>\n` +
  `<br>*Pusher: @${context?.actor}, Action: \`${context?.eventName}\`, Working Directory: \'${this.githubWorkspace}\', Workflow: \'${context?.workflow }\'*`
    

    return markdownOutput
  }

  async pollRiskAnalysisResponse() {

    let analysisResult = await this.checkRiskAnalysisResponse()
    for (let i = 0; i < 50 ; i++) {
      await this.wait(3000);
      analysisResult = await this.checkRiskAnalysisResponse()
      if (analysisResult?.additions) {
        info('##### Algosec ##### Response: ' + JSON.stringify(analysisResult))
        break;
      }
    }
    return analysisResult;
  }

  async wait(ms = 1000) {
    return new Promise(resolve => {
      info(`waiting for response...`);
      setTimeout(resolve, ms);
    });
  }

  async checkRiskAnalysisResponse() {
      const pollUrl = `${this.apiUrl}?customer=${context.repo.owner}&action_id=${this.actionUuid}`
      const response = await this.http.get(pollUrl)
      if(response?.message?.statusCode == 200){
        const message = JSON.parse(await response.readBody())
        if (message?.message_found) {
          return JSON.parse(message.result)
        } else {
          return null
        }
      } else {
        setFailed('##### Algosec ##### Poll Request failed: ' +response.message.statusMessage)
      }

    
    
  }

  async uploadFile(json: any, jwt: string) {
    const aws = new Aws(this.actionUuid, this.s3Dest)
    let res = false;
    if (json){
      const ans = await aws.uploadToS3(this.tenantId, JSON.stringify(json), jwt)
      if (ans){
        res = true;
      }
    }
    return res
  }

  async run(): Promise<void> {
    try {

      const jwt = await this.auth(this.tenantId, this.clientId, this.clientSecret, this.loginAPI)
      if (!jwt || jwt == ''){
        setFailed('##### Algosec ##### Step 0 Failed to generate token')
        return
      }
      this.steps.auth = { code: 0,  stdout: jwt , stderr: ''}
      const vcs =  new VersionControlService().getInstanceByType(this.vcsType)
      if (this.debugMode) {
        await exec('rimraf' , [this.workDir])
      }
      await this.prepareRepo()

      const foldersToRunCheck = await this.checkForDiff(this.fileType)
      const framework =  new FrameworkService().getInstanceByType(this.frameworkType)

      const asyncIterable = async (iterable, action) => {
        for (const [index, value] of iterable.entries()) {
          await action(value)
          info(`##### Algosec ##### Step 2.${index}- ${this.frameworkType} Result for folder ${value}: ${JSON.stringify(framework)}`)
        }
      }
      const filesToUpload = await asyncIterable(foldersToRunCheck, framework.init())
      await this.triggerRiskAnalysis(filesToUpload, this.steps.jwt.stdout)
    
      const riskAnalysisResponse = await this.getRiskAnalysis()
      await this.parseOutput(riskAnalysisResponse)
    } catch (error) {
      info(error)
    }

  }

  async  parseOutput(analysisResult){
    const risks = analysisResult?.additions
    const commentBody = this.parseRiskAnalysis(risks, this.steps.framework)
    // git.createComment(commentBody , octokit, context)
    this.steps.comment = await exec('gh', ['pr', 'comment', context.payload.pull_request.number.toString(), '-b', commentBody])

    if (analysisResult?.success) {
    info('##### Algosec ##### Step 5 - Parsing Risk Analysis')
      if (risks?.analysis_state){
    info('##### Algosec ##### Step 6 - The risks analysis process completed successfully without any risks')
        return
      } else {
        setFailed('##### Algosec ##### The risks analysis process completed successfully with risks, please check report')
      }
    } else {
      let errors = ''
      Object.keys(this.steps).forEach(step => errors += this.steps[step].stderr)
      setFailed('##### Algosec ##### The risks analysis process completed with errors:\n' + errors)
    }
  }

  async triggerRiskAnalysis(filesToUpload, jwt){

      const fileUploadPromises = []
      filesToUpload.forEach(file => fileUploadPromises.push(this.uploadFile(file, jwt)))
      const response = await Promise.all(fileUploadPromises)

        if (response){
        info('##### Algosec ##### Step 3 - File/s Uploaded Successfully')
      }
  }

  async prepareRepo(){
      this.steps.gitClone = await exec('git' , ['clone', `https://${context.repo.owner}:${this.ghToken}@github.com/${context.repo.owner}/${context.repo.repo}.git`, this.workDir])
      process.chdir(this.workDir)
      this.steps.gitFetch = await exec('git' , ['fetch', 'origin', `pull/${context.payload.pull_request.number.toString()}/head:${this.actionUuid}`])
      this.steps.gitCheckout = await exec('git' , ['checkout', this.actionUuid])
  }

  async getRiskAnalysis(){

    let analysisResult;

      analysisResult = await this.pollRiskAnalysisResponse()
      // let analysisResult = riskAnalysisMock
    if (!analysisResult){
      setFailed('##### Algosec ##### Risk Analysis failed to due timeout')
      return
    }
    info('##### Algosec ##### Step 4 - Risk Analysis Result: ' + JSON.stringify(analysisResult))

  }

  async auth(tenantId: string, clientID: string, clientSecret: string, loginAPI: string): Promise<string> {
    const payload = {
        "tenantId": tenantId,
        "clientId": clientID,
        "clientSecret": clientSecret
    };

    const headers = {
        "Content-Type": "application/json"
    }
    try {
        const res = await this.http.post(loginAPI, JSON.stringify(payload),headers)

        const response_code = res.message.statusCode;
        const data = JSON.parse(await res.readBody())
        if (200 <= response_code && response_code <= 300 ) {
            info(
                'Passed authentication vs CF\'s login. New token has been generated.');
            return data?.access_token;
        } else {
            setFailed(`Failed to generate token. Error code ${response_code}, msg: ${JSON.stringify(data)}`);
        }
    } catch (error: any) {
        setFailed(`Failed to generate token. Error msg: ${error.toString()}`); 
    }
    return '';
  }
  
}


const riskAnalyzer = new RiskAnalysis()
riskAnalyzer.run()


