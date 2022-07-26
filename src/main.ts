import{setFailed, getInput, info } from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {GitProcessorExec} from './git';
import {TerraformExec} from './terraform';
import {loginToAws} from './providers/aws';

export type GithubContext = typeof context

const ghToken = getInput('GITHUB_TOKEN')

async function changedFiles(){
  try {
    if (ghToken && context.payload.pull_request) {
      const octokit = getOctokit(ghToken)
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
    const diffs = await changedFiles();
    if (diffs?.length == 0){
      return
    }
    await loginToAws();
    await terraform(diffs);
  } catch (error) {
    console.log(error)
  }


}


run()


