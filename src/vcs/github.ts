import { GitHub } from "@actions/github/lib/utils";
import { context, getOctokit } from "@actions/github";
import { info, error, debug, setFailed as exit } from "@actions/core";
import { HttpClient } from "@actions/http-client";
import { exec as actionsExec, exec } from "@actions/exec";
import { WebhookPayload } from "@actions/github/lib/interfaces";
import getUuid from "uuid-by-string";
import { readdirSync } from "fs";
import { ExecOutput, ExecSteps, IVersionControl, Logger } from "./vcs.model";
import { RiskAnalysisResult, RiskAnalysisFile, AnalysisResultAdditions, severityOrder, Risk } from "../common/risk.model";

// import {githubEventPayloadMock } from "../../test/mockData.7132"
// context.payload = githubEventPayloadMock as WebhookPayload & any
export type GithubContext = typeof context;

export class Github implements IVersionControl {
  workspace: string;
  token: string;
  sha: string;
  octokit: InstanceType<typeof GitHub>;
  http: HttpClient;
  logger: Logger;
  private readonly _context;
  repo: any;
  payload: WebhookPayload;
  pullRequest: string;
  steps: ExecSteps = {};
  workDir: string;
  useCheckoutAction: boolean = false
  runFullAnalysis: boolean = false
  actionUuid: string;
  fileTypes: string[];
  stopWhenFail: boolean;
  assetsUrl: string;
  cfApiUrl: string;

  constructor() {
    this.runFullAnalysis = process?.env?.FULL_ANALYSIS == 'true';
    this.stopWhenFail = process?.env?.STOP_WHEN_FAIL != 'false';
    this.http = new HttpClient();
    const dateFormatter = (isoDate: string) => isoDate?.split("T")[0].split("-").reverse()?.join("/") + " " + isoDate.split("T")[1].replace("Z", "")
    const prefix = (str: string, group = false, close = true) => (group ? '::group::' : '- ') + dateFormatter(new Date().toISOString()) + ' ##### IAC Connectivity Risk Analysis ##### ' + str + (close && group ? '\n::endgroup::' : '')
    this.logger = {
      debug: (str: string, group = false) => debug(prefix(str, group)),
      error: (str: string, group = false) => error(prefix(str, group)),
      exit: (str: string, group = false) => exit(prefix(str, group)),
      info: (str: string, group = false, close = true) => info(prefix(str, group, close))
    };
    this.workspace = process?.env?.GITHUB_WORKSPACE ?? "";
    this.token = process?.env?.GITHUB_TOKEN ?? "";
    this.sha = process?.env?.GITHUB_SHA ?? "";
    this._context = context;
    this.octokit = getOctokit(this.token);
    this.payload = this._context?.payload;
    this.repo = this._context.repo;
    this.pullRequest = this._context?.payload?.pull_request?.number?.toString();
    this.useCheckoutAction = (process?.env?.USE_CHECKOUT && process?.env?.USE_CHECKOUT != 'false') || process?.env?.USE_CHECKOUT == 'true' ? true : false
    this.workDir = this.useCheckoutAction ? this.workspace : this.workspace + "_ALGOSEC_CODE_ANALYSIS"
    this.actionUuid = getUuid(this.sha);
    this.assetsUrl =
      "https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons";
    this.cfApiUrl = process?.env?.CF_API_URL ?? `https://${process?.env?.CF_REGION == 'anz' ? 'api.cloudflow.anz.app' : 'prod.cloudflow'}.algosec.com/cloudflow/api/devsecops/v1`;

  }

  async exec(cmd: string, args: string[]): Promise<ExecOutput> {
    const res: ExecOutput = {
      stdout: "",
      stderr: "",
      exitCode: 0,
    };

    try {
      const code = await actionsExec(cmd, args, {
        listeners: {
          stdout(data) {
            res.stdout += data.toString();
          },
          stderr(data) {
            res.stderr += data.toString();
          },
        },
      });

      res.exitCode = code;
      return res;
    } catch (err) {
      const msg = `Command '${cmd}' failed with args '${args.join(" ")}': ${res.stderr
        }: ${err}`;
      debug(`@actions/exec.exec() threw an error: ${msg}`);
      throw new Error(msg);
    }
  }

  count(array, property, value) {
    return array?.filter((obj) => obj[property] === value).length;
  }

  async getDiff(octokit: InstanceType<typeof GitHub>): Promise<any> {
    const result = await octokit.rest.repos.compareCommits({
      base: this._context?.payload?.pull_request?.base.sha,
      head: this._context?.payload?.pull_request?.head.sha,
      owner: this._context.repo.owner,
      per_page: 100,
      repo: this._context.repo.repo,
    });
    const answer = result?.data?.files ?? [];
    return answer;
  }

  async getDirectories(source: string): Promise<string[]> {
    return readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  }


  getFoldersList(dirName): string[] {
    let folders: string[] = [];
    const items = readdirSync(dirName, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith(".")) {
        folders = [...folders, ...this.getFoldersList(`${dirName}/${item.name}`)];
        folders.push(`${dirName}/${item.name}`);
      }
    }

    return folders;
  };


  hasFileType(dir: string, fileTypes: string[]): boolean {
    const files = readdirSync(dir);
    if (files.some(file => fileTypes.some(type => file.endsWith(type)))) {
      return true
    } else {
      return false
    }
  }




  async createComment(body: string): Promise<ExecOutput> {
    const result = await this.octokit.rest.issues.createComment({
      ...this._context.repo,
      issue_number: this._context.issue.number,
      body,
    });

    return {
      exitCode: result?.data?.body ? 0 : 1,
      stdout: result?.data?.body ? result?.data?.body : null,
      stderr: result?.data?.body ? null : result?.data?.body,
      url: result?.data?.html_url
    } as ExecOutput;
  }

  getRepoRemoteUrl(): string {
    return `https://${this.repo.owner}:${this.token}@github.com/${this.repo.owner}/${this.repo.repo}.git`;
  }

  async fetch(additionalGitOptions: string[] = []): Promise<ExecOutput> {
    debug(
      `Executing 'git fetch' for branch '${additionalGitOptions}' with token and options `
    );
    const args = ["fetch", ...additionalGitOptions];

    return await this.cmd(args);
  }

  async clone(baseDirectory: string): Promise<ExecOutput> {
    debug(
      `Executing 'git clone' to directory '${baseDirectory}' with token and options `
    );

    const remote = this.getRepoRemoteUrl();
    const args = ["clone", remote, baseDirectory];

    return await this.cmd(args);
  }

  async checkout(
    ghRef: string,
    additionalGitOptions: string[] = [],
    ...options: string[]
  ): Promise<ExecOutput> {
    debug(
      `Executing 'git checkout' to ref '${ghRef}' with token and options '${options.join(
        " "
      )}'`
    );

    const args = ["checkout", ghRef];
    // if (options.length > 0) {
    //     args = args.concat(options);
    // }

    return await this.cmd(args);
  }

  async cmd(
    additionalGitOptions: string[],
    ...args: string[]
  ): Promise<ExecOutput> {
    debug(`Executing Git: ${args.join(" ")}`);

    const res = await this.capture("git", additionalGitOptions);
    if (res.exitCode !== 0) {
      throw new Error(
        `Command 'git ${args.join(" ")}' failed: ${JSON.stringify(res)}`
      );
    }
    return res;
  }

  async capture(cmd: string, args: string[]): Promise<ExecOutput> {
    const res: ExecOutput = {
      stdout: "",
      stderr: "",
      exitCode: 0,
    };

    try {
      const code = await exec(cmd, args, {
        listeners: {
          stdout(data) {
            res.stdout += data.toString();
          },
          stderr(data) {
            res.stderr += data.toString();
          },
        },
      });
      res.exitCode = code;
      return res;
    } catch (err) {
      const msg = `Command '${cmd}' failed with args '${args.join(" ")}': ${res.stderr
        }: ${err}`;
      debug(`@actions/exec.exec() threw an error: ${msg}`);
      throw new Error(msg);
    }
  }

  async prepareRepo(): Promise<void> {
    this.steps.gitClone = await this.clone(this.workDir); // await this.exec('git' , ['clone', this.getRepoRemoteUrl(), this.workDir])
    process.chdir(this.workDir);
    this.steps.gitFetch = await this.fetch([
      "origin",
      `pull/${this.pullRequest}/head:${this.actionUuid}`,
    ]); // await this.exec('git' , ['fetch', 'origin', `pull/${this.pullRequest}/head:${this.actionUuid}`])
    this.steps.gitCheckout = await this.checkout(this.actionUuid); // await this.exec('git' , ['checkout', this.actionUuid])
  }

  async checkForDiffByFileTypes(fileTypes: string[]): Promise<string[]> {
    if (!this.useCheckoutAction) {
      await this.prepareRepo();
    }
    let diffFolders: any[] = [];
    try {
      const allFoldersPaths: string[] = await this.getFoldersList(this.workDir)
      allFoldersPaths.push(this.workDir)
      if (this.runFullAnalysis) {
        diffFolders = allFoldersPaths.filter(folder => this.hasFileType(folder, fileTypes))
      } else {
        const diffs = await this.getDiff(this.octokit);
        const filterdDiffs = diffs
          .filter((diff) => fileTypes?.some((fileType) => diff?.filename?.endsWith(fileType)))
          .map(diff => diff?.filename?.split("/")?.splice(0, diff?.filename?.split("/").length - 1)?.join("/"))
          .map((diff) => allFoldersPaths.reverse().find(path => path.endsWith(diff)))
        const foldersSet: Set<string> = new Set(filterdDiffs);
        diffFolders = [...foldersSet];
      }

    } catch (error: unknown) {
      if (error instanceof Error) this.logger.exit(error?.message ?? error?.toString());
    }
    if (diffFolders?.length == 0) {
      this.logger.info(
        "No changes were found"
      );
      return []
    }
    // this.logger.info(
    // `Running IaC on folders:\n ${diffFolders.join(',\n')}`
    // );
    return diffFolders;
  }

  getInputs(): object {
    return process.env;
  }

  async uploadAnalysisFile(file: RiskAnalysisFile, jwt: string): Promise<boolean> {
    try {
      const http = new HttpClient();
      const body = file?.output?.plan;
      const getPresignedUrl = `${this.cfApiUrl}/presignedurl?actionId=${file?.uuid}&owner=${context?.repo?.owner}&folder=${file?.folder}`;
      const presignedUrlResponse = await (
        await http.get(getPresignedUrl, { Authorization: `Bearer ${jwt}`, "User-Agent": "CloudFlow/1.0" })
      ).readBody();
      const presignedUrl = JSON.parse(presignedUrlResponse).presignedUrl;
      const response = await (
        await http.put(presignedUrl, body, { "Content-Type": "application/json" })
      ).readBody();
      if (response == "") {
        return true;
      } else {
        exit(response);
        return false;
      }
    } catch (e) {
      this.logger.error(`Upload file failed due to errors:\n${e}\n`)
      return false
    }

  }


  async parseOutput(
    filesToUpload: RiskAnalysisFile[],
    analysisResults: RiskAnalysisResult[],
    errorMessage: string,
    foldersToRunCheck?: string[] 
  ): Promise<void> {
    try {
      const body = this.parseCodeAnalysis(filesToUpload, analysisResults, errorMessage);
      if (body && body != "") this.steps.comment = await this.createComment(body);
      let commentUrl = ""
      try {
        commentUrl = this.steps?.comment["url"]
      } catch (e) {
        this.logger.error("Failed to create report: " + e);
      }
    if (analysisResults?.length == 0 || filesToUpload?.length > analysisResults?.length  || (foldersToRunCheck?.length ?? 0) > filesToUpload?.length) {
      this.logger.exit("The risks analysis process completed with errors, please check action's logs: " + commentUrl)
    } else  if (analysisResults?.some((response) => response?.additions && response?.additions?.analysis_result?.length > 0)) {
        this.logger[this.stopWhenFail ? 'exit' : 'info'](
          "The risks analysis process completed successfully with risks, please check report: " + commentUrl
        );
      } else if (errorMessage) {
        this.logger[this.stopWhenFail ? 'exit' : 'info'](
          "The risks analysis process completed with errors or without any risks, please check action's logs: " + commentUrl
        );
      } else {
        this.logger['info'](
          "The risks analysis process completed with errors or without any risks, please check action's logs: " + commentUrl
        );
      }
    } catch (error) {
      this.logger.error(`Failed to analyze the result.`);
      this.logger.error(error);
      this.logger.error(`For result ${JSON.stringify(analysisResults)}`);
      this.logger[this.stopWhenFail ? 'exit' : 'info'](
        "The risks analysis process completed with error, please check action's logs"
      );
    }
  }

  buildCommentAnalysisBody(
    analysis: RiskAnalysisResult | undefined,
    file: RiskAnalysisFile
  ): string {
    let analysisBody = "";

    if (!analysis?.additions) {
      analysisBody = `<details>\n<summary><sub><sub><sub><img height="20" width="20" src="${this.assetsUrl
        }/failure.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${file.folder
        }</b></h3></summary>\n${this.buildCommentFrameworkResult(file)}\n${(!analysis?.error || analysis?.error == '') ? "" : "Analysis process failed. Check logs."}\n</details>`;
  (!analysis?.error || analysis?.error == '') ? null : this.logger.error(`Analysis process failed: \n${analysis?.error}`)
    } else if (analysis?.additions?.analysis_result?.length == 0) {
      analysisBody = `<details>\n<summary><sub><sub><sub><img height="20" width="20" src="${this.assetsUrl
        }/success.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${file.folder
        }</b></h3></summary>\nNo Risks were found in this folder\n</details>`;
    } else {
      analysisBody = `<details>\n${this.buildCommentReportResult(
        analysis?.additions,
        file
      )}\n</details>`;
    }
    return analysisBody;
  }

  buildCommentReportResult(
    analysis: AnalysisResultAdditions,
    file: RiskAnalysisFile
  ): string {
    let risksList = "";
    const CODE_BLOCK = "```";
    analysis?.analysis_result?.sort(
      (a, b) =>
        parseInt(severityOrder[a.riskSeverity]) -
        parseInt(severityOrder[b.riskSeverity])
    )
      .forEach((risk) => {
        risksList += `<details>\n
<summary><img width="10" height="10" src="${this.assetsUrl}/${risk.riskSeverity
          }.svg" />  ${risk.riskId}</summary> \n
### **Title:**\n${risk.riskTitle}\n
### **Description:**\n${risk.riskDescription}\n
### **Recommendation:**\n${risk.riskRecommendation.toString()}\n
### **Details:**\n`+
          // ${CODE_BLOCK}\n
          // ${JSON.stringify(risk.items, null, "\t")}\n
          // ${CODE_BLOCK}\n
          `<table>
<thead>\n
<tr>\n
<th align="left" scope="col">Vendor</th>\n
<th align="left" scope="col">From Port</th>\n
<th align="left" scope="col">To Port</th>\n
<th align="left" scope="col">Ip Protocol</th>\n
<th align="left" scope="col">Ip Range</th>\n
</tr>\n
</thead>\n
<tbody id="tableBody">\n
${risk?.items?.map(item => 
  `<tr>\n
  <td>${item?.vendor}</td>\n
  <td>${item?.fromPort ?? ""}</td>\n
  <td>${item?.toPort ?? ""}</td>\n
  <td>${item?.ipProtocol}</td>\n
  <td>${Array.isArray(item?.ipRange) ? item?.ipRange?.join(', ') : item?.ipRange}</td>\n
  </tr>\n`)?.join('')}                
</tbody>
</table>\n
</details>\n`;
      });
    const severityCount = `<div  align="right">${this.count(analysis?.analysis_result, "riskSeverity", "critical") > 0
      ? `<img width="10" height="10" src="${this.assetsUrl}/critical.svg" />&nbsp;` +
      this.count(analysis?.analysis_result, "riskSeverity", "critical") +
      "&nbsp;Critical"
      : ""
      }${this.count(analysis?.analysis_result, "riskSeverity", "high") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/high.svg" />&nbsp;` +
        this.count(analysis?.analysis_result, "riskSeverity", "high") +
        "&nbsp;High"
        : ""
      }${this.count(analysis?.analysis_result, "riskSeverity", "medium") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/medium.svg" />&nbsp;` +
        this.count(analysis?.analysis_result, "riskSeverity", "medium") +
        "&nbsp;Medium"
        : ""
      }${this.count(analysis?.analysis_result, "riskSeverity", "low") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/low.svg" />&nbsp;` +
        this.count(analysis?.analysis_result, "riskSeverity", "low") +
        "&nbsp;Low"
        : ""
      }</div>`;
    const codeAnalysisContent = `<summary><sub><sub><sub><img height="20" width="20" src="${this.assetsUrl
      }/warning.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${file.folder}</b></h3>${analysis?.analysis_result?.length > 0 ? severityCount : ""
      }</summary>\nThe following risks were found in this folder:\n${risksList}\n`;
    return codeAnalysisContent;
  }

  // buildCommentReportError(result: RiskAnalysisResult | undefined): string {
//     const CODE_BLOCK = "```";
//     const errors = `Errors\n
// ${CODE_BLOCK}\n
// ${result?.error}\n
// ${CODE_BLOCK}\n`;
//     const analysisContent = `\n<details>
// <summary>Analysis Log</summary>
// ${!result?.error || result?.error == '' ? "Analysis Failed, check action logs" : "<br>" + errors + "<br>"}
// </details> <!-- End Format Logs -->\n`;
    // return analysisContent;
  // }

  buildCommentFrameworkResult(file: RiskAnalysisFile): string {
//     const CODE_BLOCK = "```";
//     const errors = `Errors\n
// ${CODE_BLOCK}\n
// ${file?.output?.log?.stderr ?? file?.output?.initLog?.stderr}\n
// ${CODE_BLOCK}\n`;
//     const output = `Output\n
// ${CODE_BLOCK}\n
// ${file?.output?.log?.stdout}\n
// ${CODE_BLOCK}\n`;
//     const frameworkContent = `\n<details>
// <summary>Terraform Log</summary>
// ${file?.output?.log?.stdout ? "<br>" + output + "<br>" : ""}
// ${file?.output?.log?.stderr ? "<br>" + errors + "<br>" : ""}
// </details> <!-- End Format Logs -->\n`;
const frameworkContent = `\n${file?.output?.log?.stdout ? "Terraform process success." : "Terraform process failed. Check logs."}\n`

    return frameworkContent;
  }

  buildCommentSummary(
    filesToUpload: RiskAnalysisFile[],
    results: RiskAnalysisResult[]
  ): string {
    let risksTableContents = "";
    const riskArrays = results
      .filter((result) => result?.additions && result?.additions?.analysis_result?.length > 0)
      .map((result) => {
        const folder = filesToUpload.find((file) =>
          result?.proceeded_file?.includes(file.uuid)
        )?.folder;
        return result?.additions?.analysis_result.map((risk) => {
          return {
            folder,
            riskId: risk.riskId,
            riskTitle: risk.riskTitle,
            riskSeverity: risk.riskSeverity,
            vendor: risk?.items[0]?.vendor
          };
        });
      });

    const mergedRisks = [].concat.apply([], riskArrays)?.sort(
      (a, b) =>
        parseInt(severityOrder[a.riskSeverity]) -
        parseInt(severityOrder[b.riskSeverity])
    );
    const groupedRisksById = mergedRisks.reduce(
      (accumulator: any, item: any) => {
        if (accumulator[item.riskId]) {
          const group = accumulator[item.riskId];
          if (Array.isArray(group.folder)) {
            group.folder.push(item.folder);
          } else {
            group.folder = [group.folder, item.folder];
          }
        } else {
          accumulator[item.riskId] = item;
        }
        return accumulator;
      },
      {}
    );
    Object.values(groupedRisksById).forEach((risk: any) => {
      risksTableContents += `<tr>\n
<td>${risk.riskId}</td>\n
<td align="center"><img width="10" height="10" src="${this.assetsUrl}/${risk?.riskSeverity
        }.svg" /></td>\n
<td align="center"><sub><img width="24" height="24" src="${this.assetsUrl}/${risk?.vendor?.toLowerCase() ?? "aws"
        }.svg" /></sub></td>\n
<td>${Array.isArray(risk.folder) ? risk.folder?.join(", ") : risk.folder}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`;
    });
    const risksSummary = `
\n

<div align="right">${this.count(mergedRisks, "riskSeverity", "critical") > 0
        ? `<img width="10" height="10" src="${this.assetsUrl}/critical.svg" />&nbsp;` +
        this.count(mergedRisks, "riskSeverity", "critical") +
        "&nbsp;Critical"
        : ""
      }${this.count(mergedRisks, "riskSeverity", "high") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/high.svg" />&nbsp;` +
        this.count(mergedRisks, "riskSeverity", "high") +
        "&nbsp;High"
        : ""
      }${this.count(mergedRisks, "riskSeverity", "medium") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/medium.svg" />&nbsp;` +
        this.count(mergedRisks, "riskSeverity", "medium") +
        "&nbsp;Medium"
        : ""
      }${this.count(mergedRisks, "riskSeverity", "low") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/low.svg" />&nbsp;` +
        this.count(mergedRisks, "riskSeverity", "low") +
        "&nbsp;Low"
        : ""
      }</div><br>
\n`;
    const risksTable = `<table>\n
<thead>\n
<tr>\n
<th align="left" scope="col">Risk ID</th>\n
<th align="left" scope="col">Severity</th>\n
<th align="left" scope="col">Vendor</th>\n
<th align="left" scope="col">Folder/s</th>\n
<th align="left" scope="col">Summary</th>\n
</tr>\n
</thead>\n
<tbody id="tableBody">\n
${risksTableContents}                 
</tbody>
</table>\n`;
    return results.some(
      (result) => result?.additions && result?.additions?.analysis_result?.length > 0
    )
      ? risksSummary + risksTable
      : "";
  }

  parseCodeAnalysis(
    filesToUpload: RiskAnalysisFile[],
    analysisResults: RiskAnalysisResult[],
    errMsg?: string
  ): string {
    const commentBodyArray: any[] = [];
    const header = `<img height="50" src="${this.assetsUrl}/header.svg" /> \n`;
    const footer = `\n\n---\n\n
<br>
Pusher: @${this._context?.actor}<br>
Action: ${this._context?.eventName}<br>
Workflow: ${this._context?.workflow}`;
    const summary = this.buildCommentSummary(filesToUpload, analysisResults);

    const bodyHeading = `\n**Detailed Risks Report**
---\n`;

    filesToUpload.forEach((file) => {
      const fileAnalysis = analysisResults.find((_fileAnalysis) =>
        _fileAnalysis?.proceeded_file?.includes(file.uuid)
      );
      commentBodyArray.push(
        this.buildCommentAnalysisBody(fileAnalysis, file)
      );
    });

    const analysisByFolder =
      commentBodyArray?.length > 0
        ? bodyHeading + commentBodyArray?.join("\n\n---\n\n")
        : "\n\n<h4>No risks were found.</h4>\n\n";


    if (filesToUpload?.length == 0 && analysisResults?.length == 0) {
      return header + `<br><br><sub><sub><sub><img height="20" width="20" src="${this.assetsUrl}/failure.svg" /></sub></sub></sub>&nbsp;&nbsp;<b>` + errMsg + "</b><br><br>" + footer
    }

    return header + summary + analysisByFolder + footer;

  }
}
