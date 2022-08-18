
import { exec, ExecResult } from './common/exec'
import 'dotenv/config'
import {VersionControlService} from './vcs/vcs.service'
import {FrameworkKeys, IFramework} from './iaas-tools/framework.model'
import {FrameworkService } from './iaas-tools/framework.service'
import { Aws } from './providers/aws'
import { IVersionControl, VersionControlKeys } from './vcs/vcs.model'
// import { codeAnalysisMock, terraformSinglePlanFileMock } from "./mockData"

const getUuid = require('uuid-by-string')



export class AshCodeAnalysis{
  steps: {[name: string]: ExecResult} = {}
  debugMode
  apiUrl
  tenantId
  clientId
  clientSecret
  loginAPI
  actionUuid
  githubWorkspace
  workDir

  frameworkType: FrameworkKeys
  vcsType: VersionControlKeys
  framework: IFramework
  vcs: IVersionControl
  jwt: string

  
  constructor(){
   
    this.debugMode =  process?.env?.ALGOSEC_DEBUG 
    this.apiUrl = process?.env?.API_URL
    this.tenantId = process?.env?.TENANT_ID
    this.clientId = process?.env?.CF_CLIENT_ID
    this.clientSecret = process?.env?.CF_CLIENT_SECRET
    this.loginAPI = process?.env?.CF_LOGIN_API
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
        const res = await this.vcs.http.post(loginAPI, JSON.stringify(payload),headers)

        const response_code = res.message.statusCode;
        const data = JSON.parse(await res.readBody())
        if (200 <= response_code && response_code <= 300 ) {
            this.vcs.logger.info(
                'Passed authentication vs CF\'s login. New token has been generated.');
            return data?.access_token;
        } else {
            this.vcs.logger.exit(`Failed to generate token. Error code ${response_code}, msg: ${JSON.stringify(data)}`);
        }
    } catch (error: any) {
        this.vcs.logger.exit(`Failed to generate token. Error msg: ${error.toString()}`); 
    }
    return '';
  }

  async prepareRepo(){
    this.steps.gitClone = await exec('git' , ['clone', this.vcs.getRepoRemoteUrl(), this.workDir])
    process.chdir(this.workDir)
    this.steps.gitFetch = await exec('git' , ['fetch', 'origin', `pull/${this.vcs.pullRequest}/head:${this.actionUuid}`])
    this.steps.gitCheckout = await exec('git' , ['checkout', this.actionUuid])
  }
     
  async checkForDiff(fileTypes: string[]) {
    let diffFolders
    try {
      if (this?.vcs?.octokit && this.vcs?.payload?.pull_request) {
        const diffs = await this.vcs.getDiff(this.vcs.octokit)
        const foldersSet = new Set(diffs
          .filter(diff => fileTypes.some(fileType => diff?.filename?.endsWith(fileType)))
          .map(diff => diff?.filename.split('/')[0]))
        diffFolders = [...foldersSet]
      }
    } catch (error: unknown) {
      if (error instanceof Error) this.vcs.logger.exit(error?.message)
    }
    if (diffFolders?.length == 0) {
      this.vcs.logger.info('##### Algosec ##### No changes were found in terraform plans')
        return
      }
      this.vcs.logger.info('##### Algosec ##### Step 1 - Diffs Result: ' + JSON.stringify(diffFolders))
    return diffFolders
  }

  async triggerCodeAnalysis(filesToUpload){
      
      const fileUploadPromises = []
      filesToUpload.forEach(file => fileUploadPromises.push(this.uploadFile(file)))
      const response = await Promise.all(fileUploadPromises)

        if (response){
        this.vcs.logger.info('##### Algosec ##### Step 3 - File/s Uploaded Successfully')
      }
  }

  async uploadFile(file: {uuid: string, output: any}) {
    const aws = new Aws()
    let res = false;
    if (file?.output){
      const ans = await aws.uploadToS3(file?.uuid, JSON.stringify(file?.output?.plan), this.jwt)
      if (ans){
        res = true;
      }
    }
    return res
  }

  async getCodeAnalysis(filesToUpload){

    let analysisResult
    const codeAnalysisPromises = []
    filesToUpload.forEach(file => codeAnalysisPromises.push(this.pollCodeAnalysisResponse(file)))
    analysisResult = await Promise.all(codeAnalysisPromises)
    if (!analysisResult || analysisResult?.error){
      this.vcs.logger.exit('##### Algosec ##### Code Analysis failed')
      return
    }
    this.vcs.logger.info('##### Algosec ##### Step 4 - Code Analysis Result: ' + JSON.stringify(analysisResult))
    return analysisResult

  }

  async pollCodeAnalysisResponse(file) {

    let analysisResult = await this.checkCodeAnalysisResponse(file)
    for (let i = 0; i < 50 ; i++) {
      await this.wait(3000);
      analysisResult = await this.checkCodeAnalysisResponse(file)
      if (analysisResult?.additions) {
        this.vcs.logger.info('##### Algosec ##### Response: ' + JSON.stringify(analysisResult))
        break;
      } else if (analysisResult?.error) {
        this.vcs.logger.exit('##### Algosec ##### Poll Request failed: ' + analysisResult?.error)
        break;
      }
    }
    return analysisResult;
  }

  async wait(ms = 1000) {
    return new Promise(resolve => {
      this.vcs.logger.info(`waiting for response...`);
      setTimeout(resolve, ms);
    });
  }

  async checkCodeAnalysisResponse(file) {
      const pollUrl = `${this.apiUrl}/message?customer=${this.vcs.repo.owner}&action_id=${file.uuid}`
      const response = await this.vcs.http.get(pollUrl, { 'Authorization': 'Bearer ' + this.jwt})
      if(response?.message?.statusCode == 200){
        const body = await response.readBody()
        const message = body && body != '' ? JSON.parse(body) : null
        if (message?.message_found) {
          return message?.result ? JSON.parse(message?.result) : null
        } else {
          return null
        }
      } else {
          return  {error: response.message.statusMessage}
      }
  }

  async parseOutput(filesToUpload, analysisResult){
    const body = this.vcs.parseCodeAnalysis(filesToUpload, analysisResult)
    if (body && body != '') this.steps.comment = this.vcs.createComment(body)
  }

  async run(): Promise<void> {
    try {

      this.jwt = await this.auth(this.tenantId, this.clientId, this.clientSecret, this.loginAPI)
      if (!this.jwt || this.jwt == ''){
        this.vcs.logger.exit('##### Algosec ##### Step 0 Failed to generate token')
        return
      }
      this.steps.auth = { code: 0,  stdout: this.jwt , stderr: ''}
      if (this.debugMode) {
        await exec('rimraf' , [this.workDir])
      }
      await this.prepareRepo()
      const foldersToRunCheck = await this.checkForDiff(this.framework.fileTypes)
      const filesToUpload = await this.framework.check(foldersToRunCheck, this.workDir)
      // const filesToUpload = terraformSinglePlanFileMock
      await this.triggerCodeAnalysis(filesToUpload)
      // const codeAnalysisResponse = codeAnalysisMock as any
      const codeAnalysisResponses = await this.getCodeAnalysis(filesToUpload)
      await this.parseOutput(filesToUpload, codeAnalysisResponses)
      if (codeAnalysisResponses.some(response => !response?.success)) {
        let errors = ''
        Object.keys(this.steps).forEach(step => errors += this?.steps[step]?.stderr ?? '')
        this.vcs.logger.exit('##### Algosec ##### The risks analysis process failed:\n' + errors)
      } else {
        this.vcs.logger.info('##### Algosec ##### Step 5 - Parsing Code Analysis')
        if (codeAnalysisResponses.some(response => !response?.additions?.analysis_state)) {
          this.vcs.logger.exit('##### Algosec ##### The risks analysis process completed successfully with risks, please check report')
        } else {
          this.vcs.logger.info('##### Algosec ##### Step 6 - The risks analysis process completed successfully without any risks')
          return
        }
      }
    } catch (_e) {
        this.vcs.logger?.error(_e)
    }

  }

}




