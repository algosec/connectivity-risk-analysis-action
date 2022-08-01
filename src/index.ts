import {getInput, info, setFailed, debug} from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {GitProcessorExec} from './vcs/git'
import {TerraformExec} from './iaas-tools/terraform'
import {loginToAws} from './providers/aws'
import {GitHub} from '@actions/github/lib/utils'
import {githubEventPayload} from './pull-request'
import 'dotenv/config'
import {WebhookPayload} from '@actions/github/lib/interfaces'
import { exec } from '@actions/exec'


export type GithubContext = typeof context
context.payload = githubEventPayload as WebhookPayload & any

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

const ghToken =  getInput('GITHUB_TOKEN') //process?.env?.GITHUB_TOKEN ?? getInput('GITHUB_TOKEN')
const githubWorkspace =  getInput('GITHUB_WORKSPACE') //process?.env?.GITHUB_WORKSPACE ?? getInput('GITHUB_WORKSPACE')
const tfToken =  getInput('TF_API_TOKEN') //process?.env?.TF_API_TOKEN ?? getInput('TF_API_TOKEN')
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
    const diffPromises = []
    if (tfToken) {
      diffs.filter(diff => diff !== 'tf-test-sg').forEach(diff =>  diffPromises.push(capture('sh', ['tf-run.sh', `${process?.cwd()}`, githubWorkspace, diff])))
      await Promise.all(diffPromises)
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
    info(JSON.stringify(diffs))

    

      // await git.clone(ghToken, context, './common')
    // await git.checkout(context.payload.pull_request.base.sha)
    await terraform(diffs, tfToken)
    // git.createComment('Action Works !!!', octokit, context)
  } catch (error) {
    console.log(error)
  }
}

async function capture(cmd: string, args: string[]): Promise<ExecResult> {
  const res: ExecResult = {
      stdout: '',
      stderr: '',
      code: null,
  };

  try {
      const code = await exec(cmd, args, {
          listeners: {
              stdout(data) {
                  res.stdout += data.toString();
                  // console.log(`stdout: ${res.stdout}`);
              },
              stderr(data) {
                  res.stderr += data.toString();
                  // console.log(`stderr: ${res.stderr}`);
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


run()


