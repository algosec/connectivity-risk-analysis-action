import { GitHub } from "@actions/github/lib/utils"
import { GithubContext } from "./main"

export async function getDiff(octokit: InstanceType<typeof GitHub>, context: GithubContext) {

    const result = await octokit.rest.repos.compareCommits({
      repo: context.repo.repo,
      owner: context.repo.owner,
      head: context?.payload?.pull_request?.head.sha,
      base: context?.payload?.pull_request?.base.sha,
      per_page: 100
    })
    const answer = result.data.files || []
    console.log(JSON.stringify(answer, undefined, 2))
    return answer

}