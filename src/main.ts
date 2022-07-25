import * as core from '@actions/core'
import {getInput} from '@actions/core'
import {context, getOctokit} from '@actions/github'
import dedent from 'dedent'

type GithubContext = typeof context

const inputName = getInput('name')
const ghToken = getInput('ghToken')

greet(inputName, getRepoUrl(context))

getDiff()
  .then(files => {
    console.log(
      dedent(`
    Your PR diff:
    ${JSON.stringify(files, undefined, 2)}
    `)
    )
  })
  .catch()

function greet(name: string, repoUrl: string) {
  console.log(`'Hello ${name}! You are running a GH Action in ${repoUrl}'`)
}

function getRepoUrl({repo, serverUrl}: GithubContext): string {
  console.log(`${serverUrl}/${repo.owner}/${repo.repo}`);
  return `${serverUrl}/${repo.owner}/${repo.repo}`
}

async function getDiff() {
  if (ghToken && context.payload.pull_request) {
    const octokit = getOctokit(ghToken)
    core.debug(ghToken)
    
    const result = await octokit.rest.repos.compareCommits({
      repo: context.repo.repo,
      owner: context.repo.owner,
      head: context.payload.pull_request.head.sha,
      base: context.payload.pull_request.base.sha,
      per_page: 100
    })

    return result.data.files || []
  }

  return []
}
async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    core.debug(new Date().toTimeString())
    const res = await getDiff()
    console.log(res)
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
