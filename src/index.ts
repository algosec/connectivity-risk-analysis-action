import {info, setFailed } from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {HttpClient} from '@actions/http-client'
import {Github} from './vcs/github'
import { exec } from './common/exec'
import 'dotenv/config'
import {VersionControlService} from './vcs/vcs.service'
import {FrameworkKeys, IFramework} from './iaas-tools/framework.model'
import {FrameworkService } from './iaas-tools/framework.service'
import { Aws } from './providers/aws'
import { IVersionControl, VersionControlKeys } from './vcs/vcs.model'
const getUuid = require('uuid-by-string')

export type GithubContext = typeof context

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}
import {WebhookPayload} from '@actions/github/lib/interfaces'
import {githubEventPayloadMock, riskAnalysisMock, terraformPlanFileMock} from './mockData'
context.payload = githubEventPayloadMock as WebhookPayload & any

export class RiskAnalysis{
  steps: {[name: string]: ExecResult} = {}
  debugMode
  apiUrl
  s3Dest
  tenantId
  clientId
  clientSecret
  loginAPI
  actionUuid
  githubWorkspace
  workDir
  http = new HttpClient()
  frameworkType: FrameworkKeys
  vcsType: VersionControlKeys
  framework: IFramework
  vcs: IVersionControl

  
  constructor(){
   
    this.debugMode =  process?.env?.ALGOSEC_DEBUG 
    this.apiUrl = process?.env?.RA_API_URL
    this.s3Dest = process?.env?.AWS_S3
    this.tenantId = process?.env?.TENANT_ID
    this.clientId = process?.env?.CF_CLIENT_ID
    this.clientSecret = process?.env?.CF_CLIENT_SECRET
    this.loginAPI = process?.env?.CF_LOGIN_API
    this.http = new HttpClient()
    this.frameworkType = process?.env?.FRAMEWORK_TYPE as FrameworkKeys
    this.vcsType = process?.env?.VCS_TYPE as VersionControlKeys
    this.framework =  new FrameworkService().getInstanceByType(this.frameworkType)
    this.vcs =  new VersionControlService().getInstanceByType(this.vcsType)
    this.actionUuid = getUuid(this.vcs.sha)
    this.workDir = this.vcs.workspace + '_' + this.actionUuid


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

  async prepareRepo(){
    this.steps.gitClone = await exec('git' , ['clone', `https://${context.repo.owner}:${this.vcs.token}@github.com/${context.repo.owner}/${context.repo.repo}.git`, this.workDir])
    process.chdir(this.workDir)
    this.steps.gitFetch = await exec('git' , ['fetch', 'origin', `pull/${context.payload.pull_request.number.toString()}/head:${this.actionUuid}`])
    this.steps.gitCheckout = await exec('git' , ['checkout', this.actionUuid])
  }
     
  async checkForDiff(fileTypes: string[]) {
    let diffFolders
    try {
      if (this?.vcs?.octokit && context?.payload?.pull_request) {
        const diffs = await this.vcs.getDiff(this.vcs.octokit)
        const foldersSet = new Set(diffs
          .filter(diff => fileTypes.some(fileType => diff?.filename?.endsWith(fileType)))
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

  async triggerRiskAnalysis(filesToUpload, jwt){

      const fileUploadPromises = []
      filesToUpload.forEach(file => fileUploadPromises.push(this.uploadFile(file, jwt)))
      const response = await Promise.all(fileUploadPromises)

        if (response){
        info('##### Algosec ##### Step 3 - File/s Uploaded Successfully')
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

  async getRiskAnalysis(){

    let analysisResult

      analysisResult = await this.pollRiskAnalysisResponse()
      // let analysisResult = riskAnalysisMock
    if (!analysisResult){
      setFailed('##### Algosec ##### Risk Analysis failed to due timeout')
      return
    }
    info('##### Algosec ##### Step 4 - Risk Analysis Result: ' + JSON.stringify(analysisResult))
    return analysisResult

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

  async parseOutput(analysisResult){
    const risks = analysisResult?.additions
    const body = this.vcs.parseRiskAnalysis(risks, this.steps.framework)
    this.steps.comment = this.vcs.createComment(body)
    // this.steps.comment = await exec('gh', ['pr', 'comment', context.payload.pull_request.number.toString(), '-b', commentBody])
  }

  async run(): Promise<void> {
    try {

      const jwt = await this.auth(this.tenantId, this.clientId, this.clientSecret, this.loginAPI)
      if (!jwt || jwt == ''){
        setFailed('##### Algosec ##### Step 0 Failed to generate token')
        return
      }
      this.steps.auth = { code: 0,  stdout: jwt , stderr: ''}
      if (this.debugMode) {
        await exec('rimraf' , [this.workDir])
      }
      await this.prepareRepo()
      const foldersToRunCheck = await this.checkForDiff(this.framework.fileTypes)
      const filesToUpload = await this.framework.check(foldersToRunCheck, this.workDir)
      await this.triggerRiskAnalysis(filesToUpload, this.steps.jwt.stdout)
      const riskAnalysisResponse = await this.getRiskAnalysis()
      await this.parseOutput(riskAnalysisResponse)
      if (riskAnalysisResponse?.success) {
        info('##### Algosec ##### Step 5 - Parsing Risk Analysis')
          if (riskAnalysisResponse?.additions?.analysis_state){
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
    } catch (error) {
      info(error)
    }

  }

}


const riskAnalyzer = new RiskAnalysis()
riskAnalyzer.run()


