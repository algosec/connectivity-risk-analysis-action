import{setFailed, getInput, info } from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {GitProcessorExec} from './git';
import {TerraformExec} from './terraform';
import dedent from 'dedent'

export type GithubContext = typeof context

const ghToken = getInput('GITHUB_TOKEN')

async function changedFiles(){
  try {
    if (ghToken && context.payload.pull_request) {
      const octokit = getOctokit(ghToken)
    let git = new GitProcessorExec();
    const diffs = await git.getDiff(octokit, context).then(files => {
      console.log(
       dedent(`
     Your PR diff:
     ${JSON.stringify(files, undefined, 2)}
     `)
      )
      return files;
    });
    if (diffs?.length == 0){
      return
    }
  }
 
 } catch (error: any) {
   if (error instanceof Error) setFailed(error.message)
 }
}

async function terraform(tfToken = ''){
//   try {
//     if (tfToken) {
//     let terraform = new TerraformExec(tfToken);
//     await terraform.init('token')

//     if (diffs?.length == 0){
//       return
//     }
//   }
 
//  } catch (error: any) {
//    if (error instanceof Error) setFailed(error.message)
//  }
}

async function run(): Promise<void> {
  const diffs = await changedFiles();
}




run()


