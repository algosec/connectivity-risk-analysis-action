import{setFailed, getInput, info } from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {GitProcessorExec} from './git';
import {TerraformExec} from './terraform';
import {loginToAws} from './providers/aws';
import { GitHub } from '@actions/github/lib/utils';

export type GithubContext = typeof context

const ghToken = getInput('GITHUB_TOKEN')

async function changedFiles(octokit: InstanceType<typeof GitHub>, context: GithubContext){
  try {
    if (ghToken && context.payload.pull_request) {
      let git = new GitProcessorExec();
      const diffs = await git.getDiff(octokit, context)
      return diffs;
  }
 
 } catch (error: any) {
   if (error instanceof Error) setFailed(error.message)
 }
}

async function terraform(diffs: any, tfToken = ''){
   try {
     if (tfToken) {
        let terraform = new TerraformExec(tfToken);
        await terraform.init()
        await terraform.fmt()
        await terraform.plan()
        await terraform.show()
    }
   
    } catch (error: any) {
      if (error instanceof Error) setFailed(error.message)
    }
}

async function run(): Promise<void> {

  try {
    const octokit = getOctokit(ghToken);
    const diffs = await changedFiles(octokit, context);
    if (diffs?.length == 0){
      return
    }
    await loginToAws();
    await terraform(diffs);
    let git = new GitProcessorExec();
    git.createComment('Action Works !!!', octokit, context)
  } catch (error) {
    console.log(error)
  }



}


run()


