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

const getUuid = require('uuid-by-string')

export type GithubContext = typeof context

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}
// import {WebhookPayload} from '@actions/github/lib/interfaces'
// import {githubEventPayloadMock, riskAnalysisMock} from './pull-request'
// context.payload = githubEventPayloadMock as WebhookPayload & any

const ghToken =  process?.env?.GITHUB_TOKEN 
const ghSha =  process?.env?.GITHUB_SHA 
const apiUrl = process.env.RA_API_URL
const s3Dest = process?.env?.AWS_S3
const githubWorkspace =  process?.env?.GITHUB_WORKSPACE
const actionUuid = getUuid(ghSha)
const http = new HttpClient()

async function changedFolders() {
  const octokit = getOctokit(ghToken)
  const git = new GitProcessorExec()
  let diffFolders
  try {
    if (octokit && context?.payload?.pull_request) {
      const diffs = await git.getDiff(octokit, context)
      const foldersSet = new Set(diffs
        .filter(diff => diff?.filename?.endsWith('.tf'))
        .map(diff => diff?.filename.split('/')[0]))
      diffFolders = [...foldersSet]
    }
  } catch (error: unknown) {
    if (error instanceof Error) console.log(error.message) //setFailed(error.message)
  }
  return diffFolders
}

async function terraform(diffFolder: any) {
  try {
    // const diffPromises = []
      // diffs.filter(diff => diff !== 'tf-test-sg').forEach(diff =>  diffPromises.push(exec('sh', ['tf-run.sh', `${process?.cwd()}`, githubWorkspace, diff])))
      const steps: {[name: string]: ExecResult} = {}
      process.chdir(`${githubWorkspace}/${diffFolder}`)
      steps.init = await exec('terraform', ['init']);
      steps.fmt = await exec('terraform', ['fmt', '-diff'])
      steps.validate = await exec('terraform', ['validate', '-no-color'])
      if (!existsSync('./tmp')) {
        await exec('mkdir', ['tmp'])
      }
      steps.plan = await exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process?.cwd()}\\tmp\\tf.out`])
      const initLog = {
        stdout: steps.init.stdout.concat(steps.fmt.stdout, steps.validate.stdout, steps.plan.stdout),
        stderr: steps.init.stderr.concat(steps.fmt.stderr, steps.validate.stderr, steps.plan.stderr)
      }
      let jsonPlan = {};
      if (steps.plan.stdout){
        jsonPlan = JSON.parse((await exec('terraform', ['show', '-json', `${process?.cwd()}\\tmp\\tf.out`])).stdout)
      }
      process.chdir(githubWorkspace)
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
<summary><img width="10" height="10" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/${risk.riskSeverity}.png" />  ${risk.riskId} | ${risk.riskTitle}</summary> \n
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
<td><img width="10" height="10" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/${risk.riskSeverity}.png" /> ${risk.riskSeverity.charAt(0).toUpperCase() + risk.riskSeverity.slice(1)}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`


    })
    const analysisIcon = analysis?.analysis_state ? 'success' : 'failure'
    const header = `## <img height="35" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/algosec_logo.png" /><sup> &nbsp; Connectivity Risk Analysis &nbsp; <sub><sub><img height="22" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/${analysisIcon}.png" /><sub><sub><sup><sup> \n`
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
    const terraformIcon = (terraform?.log?.stderr == '' && terraform?.initLog?.stderr == '') ? 'success' : 'failure' 
    const terraformContent = `\n## <sup>Terraform Processing &nbsp; <sub><sub><img height="22" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/${terraformIcon}.png" /><sub><sub><sup>\n
<details>
<summary>Terraform Log</summary>
<br>Output<br>
&nbsp;

${CODE_BLOCK}\n
${terraform?.log?.stdout}\n
${CODE_BLOCK}\n
Errors\n
${CODE_BLOCK}\n
${terraform?.log?.stderr ?? terraform.initLog.stderr}\n
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
    risksTable + 
   `<details open="true">\n` +
    (analysis?.analysis_result?.length > 0 ? riskAnalysisContent : 'No Risks Found\n') +
    terraformContent +
    `</details>\n` +
`*Pusher: @${context?.actor}, Action: \`${context?.eventName}\`, Working Directory: \'${githubWorkspace}\', Workflow: \'${context?.workflow }\'*`
   

  return markdownOutput
}

async function pollRiskAnalysisResponse() {

  let analysisResult = await checkRiskAnalysisResponse()
  for (let i = 0; i < 50 ; i++) {
    await wait(3000);
    analysisResult = await checkRiskAnalysisResponse()
    info('Response: ' + JSON.stringify(analysisResult))
    if (analysisResult) break;
  }
  return analysisResult;
}

async function wait(ms = 1000) {
  return new Promise(resolve => {
    console.log(`waiting ${ms} ms...`);
    setTimeout(resolve, ms);
  });
}

async function checkRiskAnalysisResponse() {
    const pollUrl = `${apiUrl}?customer=${context.repo.owner}&action_id=${actionUuid}`
    const response = JSON.parse(await (await http.get(pollUrl)).readBody())
    if (response.message_found) {
      return JSON.parse(response.result)
    } else {
      return null
    }
  
  
}

async function uploadFile(json: any) {
  let res = false;
  if (json){
    const ans = await uploadToS3(actionUuid, JSON.stringify(json))
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
                  debug(`stdout: ${res.stdout}`);
              },
              stderr(data) {
                  res.stderr += data.toString();
                  debug(`stderr: ${res.stderr}`);
              },
          },
      });
      
      res.code = code;
      return res;
  } catch (err) {
      const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
      debug(`@actions/exec.exec() threw an error: ${msg}`);
      throw new Error(msg);
  }
}

async function uploadToS3(keyName: string, body: any, bucketName?: string): Promise<PutObjectOutput> {
  debug(`got the following bucket name ${bucketName}`);
  const s3 = new AWS.S3();
  const objectParams: AWS.S3.Types.PutObjectRequest = {
    Bucket: s3Dest,
    ACL: 'bucket-owner-full-control',
    Body: body,
    Key: 'tmp' + keyName + '.out',
    Metadata: {customer: context.repo.owner, action_id: actionUuid}

  };
  return s3.putObject(objectParams).promise();
}

async function run(): Promise<void> {
  try {
    const steps: {[name: string]: ExecResult} = {}
    // steps.removeFolder = await exec('rimraf', [githubWorkspace])
    if (!existsSync(githubWorkspace)) {
      steps.cloneRepo = await exec('gh', ['repo', 'clone', context.repo.owner+'/'+context.repo.repo, githubWorkspace])
    }
    process.chdir(githubWorkspace)
    steps.pr = await exec('gh', ['pr', 'checkout', context.payload.pull_request.number.toString()])
    const diffs = await changedFolders()
    if (diffs?.length == 0) {
    info('No changes were found in terraform plans')
      return
    }
    info('Step 1 - Diffs Result: ' + JSON.stringify(diffs))
    const terraformResult = await terraform(diffs[0])
    info('Step 2 - Terraform Result: ' + JSON.stringify(terraformResult))
    let analysisResult;
    // terraformResult.plan = s3FileMock 
    if (uploadFile(terraformResult.plan)){
    info('Step 3 - File Uploaded to S3 Successfully')
      analysisResult = await pollRiskAnalysisResponse()
      // let analysisResult = riskAnalysisMock
    }
    info('Step 4 - Risk Analysis Result: ' + JSON.stringify(analysisResult))
    const risks = analysisResult?.additions
    const commentBody = parseRiskAnalysis(risks, terraformResult)
    // git.createComment(commentBody , octokit, context)
    steps.comment = await exec('gh', ['pr', 'comment', context.payload.pull_request.number.toString(), '-b', commentBody])

    if (analysisResult?.success) {
    info('Step 5 - Parsing Risk Analysis')
      if (risks?.analysis_state){
    info('Step 6 - The risks analysis process completed successfully without any risks')
        return
      } else {
        setFailed('The risks analysis process completed successfully with risks, please check report')
      }
    } else {
      let errors = ''
      Object.keys(steps).forEach(step => errors += steps[step].stderr)
      setFailed('The risks analysis process completed with errors:\n' + errors)
    }
    
   

    
  } catch (error) {
    console.log(error)
  }

}

run()


