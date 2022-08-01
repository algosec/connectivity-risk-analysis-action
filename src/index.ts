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
      await exec('terraform', ['init'])
      await exec('terraform', ['fmt', '-diff'])
      await exec('terraform', ['validate', '-no-color'])
      if (!existsSync('./tmp')) {
        await exec('mkdir', ['tmp'])
      }
      const plan = await exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process?.cwd()}\\tmp\\tf.out`])
      let json = {};
      if (plan.stdout){
        json = JSON.parse((await exec('terraform', ['show', '-json', `${process?.cwd()}\\tmp\\tf.out`])).stdout)
      }
      process.chdir(`${githubWorkspace}`)
      return json;


      
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
    
    // await loginToAws();
    const git = new GitProcessorExec()
    // info(JSON.stringify(context))

    const diffs = await changedFiles(octokit, context, git)
    if (diffs?.length == 0) {
      return
    }
    info('Diffs: ' + JSON.stringify(diffs))
    

    const fileToUpload = await terraform(diffs, tfToken)
    // const fileToUpload = s3File 
    let analysisResult;
    if (uploadFile(fileToUpload)){
      analysisResult = await pollRiskAnalysisResponse()
    }
    
    if (analysisResult?.success){
      info('Parsing Report')
      git.createComment('Risk Analysis Completed, no risks were found', octokit, context)
    } else {
      parseRiskAnalysis(octokit, git, analysisResult)
    }

    
  } catch (error) {
    console.log(error)
  }

}

async function parseRiskAnalysis(octokit, git, riskAnalysis) {
  info('Parsing Report')
  const body = parseToGithubSyntax(riskAnalysis)
  git.createComment(body, octokit, context)
  return;
}

function parseToGithubSyntax(riskAnalysis) {
  return JSON.stringify(riskAnalysis)
}

async function pollRiskAnalysisResponse() {
  
  let analysisResult = await checkRiskAnalysisResponse()
  for (let i = 0; i < 50 ; i++) {
    await wait(5000);
    analysisResult = await checkRiskAnalysisResponse()
    if (analysisResult) return analysisResult
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
    const {message_found, result} = JSON.parse(await (await http.get(pollUrl)).readBody())


    if (message_found)
    {
      const parsedResult = JSON.parse(result)
      if (parsedResult?.success) {
          const riskAnalysis = parsedResult?.additions?.analysis_result
          const analysisState = parsedResult?.additions?.analysis_state
          if (analysisState && riskAnalysis?.length == 0){
            info('The risks analysis process completed successfully without any risks')
          } else {
            info('The risks analysis process completed successfully with risks, please check report')
            return riskAnalysis
          }

      } else {
        setFailed('The risks analysis process completed with errors, please check report')
      }
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
                  info(`stdout: ${res.stdout}`);
                  // debug(`stdout: ${res.stdout}`);
              },
              stderr(data) {
                  res.stderr += data.toString();
                  info(`stderr: ${res.stderr}`);
                  // debug(`stderr: ${res.stderr}`);
              },
          },
      });
      
      res.code = code;
      info(`EXEC RESPONSE: ${JSON.stringify(res)}`)
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


