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
const uuid = require('uuid');
export type GithubContext = typeof context

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}
// import {WebhookPayload} from '@actions/github/lib/interfaces'
// import {githubEventPayloadMock, codeAnalysisMock, terraformPlanFileMock} from './mockData'
// context.payload = githubEventPayloadMock as WebhookPayload & any

export class CodeAnalysis{
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
  http = new HttpClient()
  frameworkType: FrameworkKeys
  vcsType: VersionControlKeys
  framework: IFramework
  vcs: IVersionControl

  
  constructor(){
   
    this.debugMode =  process?.env?.ALGOSEC_DEBUG 
    this.apiUrl = process?.env?.API_URL
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

  async triggerCodeAnalysis(filesToUpload, jwt){
      
      const fileUploadPromises = []
      filesToUpload.forEach(file => fileUploadPromises.push(this.uploadFile(file, jwt)))
      const response = await Promise.all(fileUploadPromises)

        if (response){
        info('##### Algosec ##### Step 3 - File/s Uploaded Successfully')
      }
  }

  async uploadFile(file: {uuid: string, output: any}, jwt: string) {
    const aws = new Aws()
    let res = false;
    if (file?.output){
      const ans = await aws.uploadToS3(file?.uuid, JSON.stringify(file?.output?.plan), jwt)
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
    if (!analysisResult){
      setFailed('##### Algosec ##### Code Analysis failed to due timeout')
      return
    }
    info('##### Algosec ##### Step 4 - Code Analysis Result: ' + JSON.stringify(analysisResult))
    return analysisResult

  }

  async pollCodeAnalysisResponse(file) {

    let analysisResult = await this.checkCodeAnalysisResponse(file)
    for (let i = 0; i < 50 ; i++) {
      await this.wait(3000);
      analysisResult = await this.checkCodeAnalysisResponse(file)
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

  async checkCodeAnalysisResponse(file) {
      const pollUrl = `${this.apiUrl}/message?customer=${context.repo.owner}&action_id=${file.uuid}`
      const response = await this.http.get(pollUrl)
      if(response?.message?.statusCode == 200){
        const body = await response.readBody()
        const message = body && body != '' ? JSON.parse(body) : null
        if (message?.message_found) {
          return message?.result ? JSON.parse(message?.result) : null
        } else {
          return null
        }
      } else {
        setFailed('##### Algosec ##### Poll Request failed: ' +response.message.statusMessage)
      }
  }

  async parseOutput(filesToUpload, analysisResult){
    const body = this.vcs.parseCodeAnalysis(filesToUpload, analysisResult)
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
      // const filesToUpload = terraformPlanFileMock
      await this.triggerCodeAnalysis(filesToUpload, jwt)
      // const codeAnalysisResponse = codeAnalysisMock as any
      const codeAnalysisResponse = await this.getCodeAnalysis(filesToUpload)
      await this.parseOutput(filesToUpload, codeAnalysisResponse)
      if (codeAnalysisResponse?.success) {
        info('##### Algosec ##### Step 5 - Parsing Code Analysis')
          if (codeAnalysisResponse?.additions?.analysis_state){
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


const codeAnalyzer = new CodeAnalysis()
codeAnalyzer.run()


