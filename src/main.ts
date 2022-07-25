import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {getDiff} from './changedFiles';
import dedent from 'dedent'

export type GithubContext = typeof context

const ghToken = core.getInput('GITHUB_TOKEN')

async function run(): Promise<void> {
  try {
    if (ghToken && context.payload.pull_request) {
      const octokit = getOctokit(ghToken)

    const res = await getDiff(octokit, context).then({
      console.log(
        dedent(`
      Your PR diff:
      ${JSON.stringify(files, undefined, 2)}
      `)
      )
    })
    }
  } catch (error: any) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// run()

