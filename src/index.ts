import {debug, getInput, info, setFailed } from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {HttpClient} from '@actions/http-client'

import {GitProcessorExec} from './vcs/git'
// import {TerraformExec} from './iaas-tools/terraform'
// import {loginToAws} from './providers/aws'
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
// import {githubEventPayload} from './pull-request'
// import { s3File } from '../test-repo/tmp/tf.json'
// context.payload = githubEventPayload as WebhookPayload & any
// const ghToken =  process?.env?.GITHUB_TOKEN ?? getInput('GITHUB_TOKEN')
// const ghSha =  /process?.env?.GITHUB_SHA ?? getInput('GITHUB_SHA')
// const githubWorkspace =  process.cwd() + '\\' + process?.env?.GITHUB_WORKSPACE ?? getInput('GITHUB_WORKSPACE')
// const githubRepoOwner  =  process?.env?.GITHUB_REPOSITORY_OWNER ?? getInput('GITHUB_REPOSITORY_OWNER')
// const tfToken = process?.env?.TF_API_TOKEN ?? getInput('TF_API_TOKEN')
// const apiUrl = process.env.RA_API_URL ?? getInput('RA_API_URL')
// const s3Dest = process?.env?.AWS_S3 ?? getInput('AWS_S3')
const ghToken =  getInput('GITHUB_TOKEN')
const ghSha =  getInput('GITHUB_SHA') 
const githubWorkspace =  getInput('GITHUB_WORKSPACE') 
const githubRepoOwner  =  getInput('GITHUB_REPOSITORY_OWNER')
const tfToken = getInput('TF_API_TOKEN') 
const apiUrl = getInput('RA_API_URL') 
const s3Dest = getInput('AWS_S3') 
const actionUuid = generateTmpFileUuid()
const http = new HttpClient()

// const tfHost =  getInput('TF_HOST') //process?.env?.TF_HOST ?? getInput('TF_HOST')
// const awsAccessKeyId = getInput('AWS_ACCESS_KEY_ID') // process?.env?.AWS_ACCESS_KEY_ID ?? 
// const awsSecretAccessKey = getInput('AWS_SECRET_ACCESS_KEY') // process?.env?.AWS_SECRET_ACCESS_KEY ?? 

async function changedFiles(
  octokit: InstanceType<typeof GitHub>,
  context: GithubContext,
  git: any
) {
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

async function terraform(diffs: any, tfToken = '') {
  try {
    // const diffPromises = []
    if (tfToken) {
      // diffs.filter(diff => diff !== 'tf-test-sg').forEach(diff =>  diffPromises.push(exec('sh', ['tf-run.sh', `${process?.cwd()}`, githubWorkspace, diff])))
      process.chdir(`${githubWorkspace}/${diffs[0]}`)
      const init = await exec('terraform', ['init']);
      const fmt = await exec('terraform', ['fmt', '-diff'])
      const validate = await exec('terraform', ['validate', '-no-color'])
      if (!existsSync('./tmp')) {
        await exec('mkdir', ['tmp'])
      }
      const plan = await exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process?.cwd()}\\tmp\\tf.out`])
      const terraformLog = init.stdout.concat(fmt.stdout, validate.stdout, init.stdout)
      let jsonPlan = {};
      if (plan.stdout){
        jsonPlan = JSON.parse((await exec('terraform', ['show', '-json', `${process?.cwd()}\\tmp\\tf.out`])).stdout)
      }
      process.chdir(`${githubWorkspace}`)
      return {plan: jsonPlan, log: plan.stdout};


      
      // await Promise.all(diffPromises)
      // await terraform.show()
    }
  } catch (error: any) {
    if (error instanceof Error) console.log(error.message) //setFailed(error.message)
  }
}

async function run(): Promise<void> {
  try {
    
    const octokit = getOctokit(ghToken)
    const git = new GitProcessorExec()
    // await loginToAws();
    const diffs = await changedFiles(octokit, context, git)
    if (diffs?.length == 0) {
      return
    }
    info('Diffs Result: ' + JSON.stringify(diffs))
    const terraformResult = await terraform(diffs, tfToken)
    info('Terraform Result: ' + JSON.stringify(terraformResult))
    // const fileToUpload = s3File 
    let analysisResult;
    if (uploadFile(terraformResult.plan)){
    info('File Uploaded to S3 Successfully')
      analysisResult = await pollRiskAnalysisResponse()
    }
    info('Risk Analysis Result: ' + JSON.stringify(analysisResult))
    if (analysisResult?.result?.success) {
      const risks = analysisResult?.result?.additions
      if (risks?.analysis_state){
    info('The risks analysis process completed successfully without any risks')
        git.createComment('Risk Analysis Completed, no risks were found', octokit, context)
        return
      } else {
    info('Parsing Report')
        const commentBody = parseRiskAnalysis(risks, terraformResult)
        git.createComment(commentBody, octokit, context)
        setFailed('The risks analysis process completed successfully with risks, please check report')
      }
    } else {
      setFailed('The risks analysis process completed with errors')
    }
    
   

    
  } catch (error) {
    console.log(error)
  }

}

function parseRiskAnalysis(analysis, terraform) {
  const body = parseToGithubSyntax(analysis, terraform)
  return body;
}

function parseToGithubSyntax(analysis, terraform) {
    const CODE_BLOCK = '```';
    

    const output = `## ![alt text](https://raw.githubusercontent.com/alonnalgo/action-test/main/algosec_logo.png "Connectivity Risk Analysis") ${analysis.analysis_state ? ':heavy_check_mark:' : ':x:' }  Connectivity Risk Analysis :cop:
<details open="true">
<summary>Report</summary>
${'ANALYSIS REPORT'}
</details>`
+
analysis?.analysis_result?.forEach(risk => {
      return 
      `<details open="true">
<summary>${risk.riskSeverity}  ${risk.riskId}</summary>
${risk.riskTitle}
###### Description: ${risk.riskDescription}
###### Recommendation: ${risk.riskRecommendation}
###### Details:
${CODE_BLOCK}
${risk.items}
${CODE_BLOCK}`
})
+
`<details>
<summary>Logs</summary>
Output
${CODE_BLOCK}json
${analysis?.analysis_result}
${CODE_BLOCK}

Errors
${ CODE_BLOCK }
${'env.analysis_err'}
${ CODE_BLOCK }
</details>
## ${terraform.log.stdout ? ':heavy_check_mark:' : ':x:' } Terraform Processing ⚙️
<details><summary>Terraform Log</summary>
Output
${ CODE_BLOCK }
${terraform.log.stdout }
${ CODE_BLOCK }
Errors
${ CODE_BLOCK }
${terraform.log.stderr}
${ CODE_BLOCK }
</details> <!-- End Format Logs -->
*Pusher: @${context.actor}, Action: \`${context.eventName}\`, Working Directory: \'${'env.tf_actions_working_dir'}\', Workflow: \'${context.workflow }\'*`
   

  return output
}

async function pollRiskAnalysisResponse() {

  let analysisResult = await checkRiskAnalysisResponse()
  for (let i = 0; i < 50 ; i++) {
    await wait(3000);
    analysisResult = await checkRiskAnalysisResponse()
    info('Response: \n' + JSON.stringify(analysisResult))
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
    const pollUrl = `${apiUrl}?customer=${githubRepoOwner}&action_id=${actionUuid}`
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

function generateTmpFileUuid() {
  const uuid = getUuid(ghSha);
  return uuid;
}

async function createTmpFile(json) {
  writeFileSync(`${githubWorkspace}\\tmp\\tf.json.out`, JSON.stringify(json))
  info('File was created successfully')

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
      // info(`EXEC RESPONSE: ${JSON.stringify(res)}`)
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
    Metadata: {customer: githubRepoOwner, action_id: actionUuid}

  };
  return s3.putObject(objectParams).promise();
}


run()


