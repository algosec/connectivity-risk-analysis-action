import {debug, getInput, info, setFailed } from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {HttpClient} from '@actions/http-client'

import {GitProcessorExec} from './vcs/git'
import {GitHub} from '@actions/github/lib/utils'

import { exec as actionsExec } from '@actions/exec'
import {existsSync, writeFileSync} from 'fs'
import * as AWS from 'aws-sdk';
import { PutObjectOutput } from 'aws-sdk/clients/s3'
import 'dotenv/config'
import {AwsProvider} from './providers/aws'
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


const ghToken =  process?.env?.GITHUB_TOKEN 
const debugMode =  process?.env?.ALGOSEC_DEBUG 
const ghSha =  process?.env?.GITHUB_SHA 
const apiUrl = process?.env?.RA_API_URL
const s3Dest = process?.env?.AWS_S3
const tenantId = process?.env?.TENANT_ID
const clientId = process?.env?.CF_CLIENT_ID
const clientSecret = process?.env?.CF_CLIENT_SECRET
const loginAPI = process?.env?.CF_LOGIN_API
const actionUuid = getUuid(ghSha)
const githubWorkspace =  process?.env?.GITHUB_WORKSPACE//+'_'+actionUuid
const http = new HttpClient()
const workDir = githubWorkspace+'_'+actionUuid

async function changedFolders() {
  const octokit = getOctokit(ghToken)
  const git = new GitProcessorExec()
  let diffFolders
  try {
    if (octokit && context?.payload?.pull_request) {
      const diffs = await git.getDiff(octokit)
      const foldersSet = new Set(diffs
        .filter(diff => diff?.filename?.endsWith('.tf'))
        .map(diff => diff?.filename.split('/')[0]))
      diffFolders = [...foldersSet]
    }
  } catch (error: unknown) {
    if (error instanceof Error) setFailed(error.message)
  }
  return diffFolders
}

async function terraform(diffFolder: any) {
  try {
    
      const steps: {[name: string]: ExecResult} = {}
      process.chdir(`${workDir}/${diffFolder}`)
      // steps.setupVersion = await exec('curl', ['-L', 'https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh', '|', 'bash']);
      // info('##### Algosec ##### tfswitch Installed successfully')
      // if (process?.env?.TF_VERSION == "latest"  || process?.env?.TF_VERSION  == ""){
      //   steps.switchVersion = await exec('tfswitch', ['--latest']);
      // } else {
      //   steps.switchVersion = await exec('tfswitch', []);
      // }
      info('##### Algosec ##### tfswitch version: ' + process?.env?.TF_VERSION)
      steps.init = await exec('terraform', ['init']);

      steps.fmt = await exec('terraform', ['fmt', '-diff'])
      steps.validate = await exec('terraform', ['validate', '-no-color'])
      if (!existsSync('./tmp')) {
        await exec('mkdir', ['tmp'])
      }
      steps.plan = await exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process?.cwd()}\\tmp\\tf-${diffFolder}.out`])
      const initLog = {
        stdout: steps.init.stdout.concat(steps.fmt.stdout, steps.validate.stdout, steps.plan.stdout),
        stderr: steps.init.stderr.concat(steps.fmt.stderr, steps.validate.stderr, steps.plan.stderr)
      }
      let jsonPlan = {};
      if (steps.plan.stdout){
        jsonPlan = JSON.parse((await exec('terraform', ['show', '-json', `${process?.cwd()}\\tmp\\tf-${diffFolder}.out`])).stdout)
      }
      process.chdir(workDir)
      return {plan: jsonPlan, log: steps.plan, initLog};
  } catch (error: any) {
    if (error instanceof Error) console.log(error.message) //setFailed(error.message)
  }
}

function parseRiskAnalysis(analysis, terraform) {
  const body = parseToGithubSyntax(analysis, terraform)
  return body;
}

function parseToGithubSyntax(analysis, terraform) {
  
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
    const analysisIcon = analysis?.analysis_state ? 'X' : 'V'
    const header = `<img height="35" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/RiskAnalysis${analysisIcon}.svg" /> \n`
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
    const terraformIcon = (terraform?.log?.stderr == '' && terraform?.initLog?.stderr == '') ? 'X' : 'V'
    const terraformContent = `\n<img height="22" src="https://raw.githubusercontent.com/alonnalgoDevSecOps/risk-analysis-action/main/icons/Terraform${terraformIcon}.svg" />\n
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
`<br>*Pusher: @${context?.actor}, Action: \`${context?.eventName}\`, Working Directory: \'${githubWorkspace}\', Workflow: \'${context?.workflow }\'*`
   

  return markdownOutput
}

async function pollRiskAnalysisResponse() {

  let analysisResult = await checkRiskAnalysisResponse()
  for (let i = 0; i < 50 ; i++) {
    await wait(3000);
    analysisResult = await checkRiskAnalysisResponse()
    if (analysisResult) {
      info('##### Algosec ##### Response: ' + JSON.stringify(analysisResult))
      break;
    }
  }
  return analysisResult;
}

async function wait(ms = 1000) {
  return new Promise(resolve => {
    // console.log(`waiting ${ms} ms...`);
    setTimeout(resolve, ms);
  });
}

async function checkRiskAnalysisResponse() {
    const pollUrl = `${apiUrl}?customer=${context.repo.owner}&action_id=${actionUuid}`
    const response = await http.get(pollUrl)
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

async function uploadFile(json: any, jwt: string) {
  const aws = new AwsProvider(actionUuid, s3Dest)
  let res = false;
  if (json){
    const ans = await aws.uploadToS3(tenantId, JSON.stringify(json), jwt)
    if (ans){
      res = true;
    }
  }

  return res
}

async function exec(cmd: string, args: string[]): Promise<ExecResult> {
  const res: ExecResult = {
      stdout: '',
      stderr: '',
      code: null,
  };

  try {
      const code = await actionsExec(cmd, args, {
          listeners: {
              stdout(data) {
                  res.stdout += data.toString();
                  debug(`##### Algosec ##### stdout: ${res.stdout}`);
              },
              stderr(data) {
                  res.stderr += data.toString();
                  debug(`##### Algosec ##### stderr: ${res.stderr}`);
              },
          },
      });
      
      res.code = code;
      return res;
  } catch (err) {
      const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
      debug(`##### Algosec ##### @actions/exec.exec() threw an error: ${msg}`);
      throw new Error(msg);
  }
}



async function run(): Promise<void> {
  try {
    const steps: {[name: string]: ExecResult} = {}
    const jwt = await auth(tenantId, clientId, clientSecret, loginAPI)
    if (!jwt || jwt == ''){
      setFailed('##### Algosec ##### Step 0 Failed to generate token')
      return
    }
    steps.auth = { code: 0,  stdout: jwt , stderr: ''}
    if (debugMode) {
      await exec('rimraf' , [workDir])
    }
    steps.gitClone = await exec('git' , ['clone', `https://${context.repo.owner}:${ghToken}@github.com/${context.repo.owner}/${context.repo.repo}.git`, workDir])
    process.chdir(workDir)
    steps.gitFetch = await exec('git' , ['fetch', 'origin', `pull/${context.payload.pull_request.number.toString()}/head:${actionUuid}`])
    steps.gitCheckout = await exec('git' , ['checkout', actionUuid])
    const diffs = await changedFolders()
    if (diffs?.length == 0) {
    info('##### Algosec ##### No changes were found in terraform plans')
      return
    }
    info('##### Algosec ##### Step 1 - Diffs Result: ' + JSON.stringify(diffs))
    const diffPromises = []
    diffs.forEach(diff => diffPromises.push(initRiskAnalysis(steps, diff)))
    const response = await Promise.all(diffPromises)
    console.log(response)
    
  } catch (error) {
    console.log(error)
  }

}

async function initRiskAnalysis(steps, diff){

  const terraformResult = await terraform(diff)
  info(`##### Algosec ##### Step 2 - Terraform Result for folder ${diff}: ${JSON.stringify(terraformResult)}`)
  let analysisResult;
  const fileUploaded = await uploadFile(terraformResult?.plan, steps.auth.stdout)
  // const fileUploaded = await uploadFile(terraformPlanFileMock)
  if (fileUploaded){
  info('##### Algosec ##### Step 3 - File Uploaded to S3 Successfully')
    analysisResult = await pollRiskAnalysisResponse()
    // let analysisResult = riskAnalysisMock
  }
  if (!analysisResult){
    setFailed('##### Algosec ##### Risk Analysis failed to due timeout')
    return
  }
  info('##### Algosec ##### Step 4 - Risk Analysis Result: ' + JSON.stringify(analysisResult))
  const risks = analysisResult?.additions
  const commentBody = parseRiskAnalysis(risks, terraformResult)
  // git.createComment(commentBody , octokit, context)
  steps.comment = await exec('gh', ['pr', 'comment', context.payload.pull_request.number.toString(), '-b', commentBody])

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
    Object.keys(steps).forEach(step => errors += steps[step].stderr)
    setFailed('##### Algosec ##### The risks analysis process completed with errors:\n' + errors)
  }
}

async function auth(tenantId: string, clientID: string, clientSecret: string, loginAPI: string): Promise<string> {
  const payload = {
      "tenantId": tenantId,
      "clientId": clientID,
      "clientSecret": clientSecret
  };

  const headers = {
      "Content-Type": "application/json"
  }
  try {
      const res = await http.post(loginAPI, JSON.stringify(payload),headers)
      
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

run()


