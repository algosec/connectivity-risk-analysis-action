import { GitHub } from "@actions/github/lib/utils";
import { context, getOctokit } from "@actions/github";
import { info, error, debug, setFailed as exit } from "@actions/core";
import { HttpClient } from "@actions/http-client";
import { IVersionControl, Logger } from "./vcs.model";
import { WebhookPayload } from "@actions/github/lib/interfaces";
import { exec, ExecOutput } from "@actions/exec";
import { ExecSteps, AnalysisFile, count } from "../common/exec";
import { AnalysisResult, AnalysisResultAdditions, severityOrder } from "../common/risk.model";
import getUuid from "uuid-by-string";
import { readdir } from "fs/promises";
import { readdirSync } from "fs";


export type GithubContext = typeof context;

// DEBUG LOCALLY
// import {githubEventPayloadMock } from "../../test/mockData.azure"
// context.payload = githubEventPayloadMock as WebhookPayload & any

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
  firstRun: boolean = false
  actionUuid: string;
  fileTypes: string[];
  stopWhenFail: boolean;
  assetsUrl: string;
  cfApiUrl: string;

  constructor() {
    this.firstRun = process?.env?.FIRST_RUN == 'true'
    this.stopWhenFail = process?.env?.STOP_WHEN_FAIL == 'true';
    this.http = new HttpClient();
    this.logger = { debug, error, exit, info };
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
    this.cfApiUrl = process?.env?.CF_API_URL ?? "https://api-feature-cs-0015342.dev.cloudflow.algosec.com/cloudflow/api/devsecops/v1";

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
  return (await readdir(source, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  }

  hasFileType(dir:string, fileTypes: string[]): boolean {
    const files = readdirSync(dir);
      if (files.some(file => fileTypes.some(type => file.endsWith(type)))){
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
      const msg = `Command '${cmd}' failed with args '${args.join(" ")}': ${
        res.stderr
      }: ${err}`;
      debug(`@actions/exec.exec() threw an error: ${msg}`);
      throw new Error(msg);
    }
  }

  async prepareRepo(): Promise<void> {
    this.steps.gitClone = await this.clone(this.workDir); // await exec('git' , ['clone', this.getRepoRemoteUrl(), this.workDir])
    process.chdir(this.workDir);
    this.steps.gitFetch = await this.fetch([
      "origin",
      `pull/${this.pullRequest}/head:${this.actionUuid}`,
    ]); // await exec('git' , ['fetch', 'origin', `pull/${this.pullRequest}/head:${this.actionUuid}`])
    this.steps.gitCheckout = await this.checkout(this.actionUuid); // await exec('git' , ['checkout', this.actionUuid])
  }

  async checkForDiffByFileTypes(fileTypes: string[]): Promise<string[]> {
    if (!this.useCheckoutAction){
      await this.prepareRepo();
    }
    let diffFolders: string[] = [];
    try {
      if (this.firstRun){
        const allFolders = await this.getDirectories(this.workDir)
        diffFolders = allFolders.filter(folder => this.hasFileType(folder, fileTypes))
      } else {
        const diffs = await this.getDiff(this.octokit);
        const foldersSet: Set<string> = new Set(
          diffs
            .filter((diff) =>
              fileTypes?.some((fileType) => diff?.filename?.endsWith(fileType))
            )
            .map((diff) => diff?.filename.split("/")[0])
        );
        diffFolders = [...foldersSet];
      }
    
    } catch (error: unknown) {
      if (error instanceof Error) this.logger.exit(error?.message);
    }
    if (diffFolders?.length == 0) {
      this.logger.info(
        "- ##### IAC Connectivity Risk Analysis ##### No changes were found"
      );
      return []
    }
    this.logger.info(
      `- ##### IAC Connectivity Risk Analysis ##### Found changes in folders ${diffFolders.join(', ')}`
    );
    return diffFolders;
  }

  getInputs(): object {
    return process.env;
  }

  async uploadAnalysisFile(file: AnalysisFile, jwt: string): Promise<boolean> {
    try {
      const http = new HttpClient();
      const body = file?.output?.plan;
      const getPresignedUrl = `${this.cfApiUrl}/presignedurl?actionId=${file?.uuid}&owner=${context?.repo?.owner}&folder=${file?.folder}`;
      const presignedUrlResponse = await (
        await http.get(getPresignedUrl, { Authorization: `Bearer ${jwt}` })
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
    } catch(e){
      console.log(`::group::##### IAC Connectivity Risk Analysis ##### Upload file failed due to errors:\n${e}\n::endgroup::`)
      return false
    }
   
  }


  async parseOutput(
    filesToUpload: AnalysisFile[],
    analysisResults: AnalysisResult[]
  ): Promise<void> {
    const body = this.parseCodeAnalysis(filesToUpload, analysisResults);
    if (body && body != "") this.steps.comment = await this.createComment(body);
    if (analysisResults?.some((response) => !response?.success)) {
      let errors = "";
      Object.keys(this.steps).forEach(step => errors += this?.steps[step]?.stderr != '' ? this?.steps[step]?.stderr : '')
      this.logger.exit(
        "- ##### IAC Connectivity Risk Analysis ##### The risks analysis process failed.\n" + errors
      );
    } else {
      this.logger.info("- ##### IAC Connectivity Risk Analysis ##### Creating Risks Report");
      if (
        analysisResults?.some(
          (response) => response?.additions?.analysis_result?.length > 0
        )
      ) {
        if (this.stopWhenFail)
          this.logger.exit(
            "- ##### IAC Connectivity Risk Analysis ##### The risks analysis process completed successfully with risks, please check report"
          );
        else
          this.logger.info(
            "- ##### IAC Connectivity Risk Analysis ##### The risks analysis process completed successfully with risks, please check report"
          );
      } else {
        this.logger.info(
          "- ##### IAC Connectivity Risk Analysis ##### Analysis process completed successfully without any risks"
        );
      }
    }
  }

  buildCommentAnalysisBody(
    analysis: AnalysisResultAdditions | undefined,
    file: AnalysisFile
  ): string {
    let analysisBody = "";

    if (!analysis?.analysis_result) {
      analysisBody = `<details>\n<summary><sub><sub><sub><img height="20" width="20" src="${
        this.assetsUrl
      }/failure.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${
        file.folder
      }</b></h3></summary>\n${this.buildCommentFrameworkResult(
        file
      )}\n</details>`;
    } else if (analysis?.analysis_result?.length == 0) {
      analysisBody = `<details>\n<summary><sub><sub><sub><img height="20" width="20" src="${
        this.assetsUrl
      }/success.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${
        file.folder
      }</b></h3></summary>\n${this.buildCommentFrameworkResult(
        file
      )}\n</details>`;
    } else {
      analysisBody = `<details>\n${this.buildCommentReportResult(
        analysis,
        file
      )}\n${this.buildCommentFrameworkResult(file)}\n</details>`;
    }
    return analysisBody;
  }

  buildCommentReportResult(
    analysis: AnalysisResultAdditions,
    file: AnalysisFile
  ): string {
    let risksList = "";
    const CODE_BLOCK = "```";
    analysis?.analysis_result
      .sort(
        (a, b) =>
          parseInt(severityOrder[a.riskSeverity]) -
          parseInt(severityOrder[b.riskSeverity])
      )
      .forEach((risk) => {
        risksList += `<details>\n
<summary><img width="10" height="10" src="${this.assetsUrl}/${
          risk.riskSeverity
        }.svg" />  ${risk.riskId}</summary> \n
### **Title:**\n${risk.riskTitle}\n
### **Description:**\n${risk.riskDescription}\n
### **Recommendation:**\n${risk.riskRecommendation.toString()}\n
### **Details:**\n
${CODE_BLOCK}\n
${JSON.stringify(risk.items, null, "\t")}\n
${CODE_BLOCK}\n
</details>\n`;
      });
    const severityCount = `<div  align="right">${
      count(analysis?.analysis_result, "riskSeverity", "critical") > 0
        ? `<img width="10" height="10" src="${this.assetsUrl}/critical.svg" />&nbsp;` +
          count(analysis?.analysis_result, "riskSeverity", "critical") +
          "&nbsp;Critical"
        : ""
    }${
      count(analysis?.analysis_result, "riskSeverity", "high") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/high.svg" />&nbsp;` +
          count(analysis?.analysis_result, "riskSeverity", "high") +
          "&nbsp;High"
        : ""
    }${
      count(analysis?.analysis_result, "riskSeverity", "medium") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/medium.svg" />&nbsp;` +
          count(analysis?.analysis_result, "riskSeverity", "medium") +
          "&nbsp;Medium"
        : ""
    }${
      count(analysis?.analysis_result, "riskSeverity", "low") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/low.svg" />&nbsp;` +
          count(analysis?.analysis_result, "riskSeverity", "low") +
          "&nbsp;Low"
        : ""
    }</div>`;
    const codeAnalysisContent = `<summary><sub><sub><sub><img height="20" width="20" src="${
      this.assetsUrl
    }/warning.svg" /></sub></sub></sub>&nbsp;&nbsp;<h3><b>${
      file.folder +
      (analysis?.analysis_result?.length == 0 ? "- No Risks Found" : "")
    }</b></h3>${
      analysis?.analysis_result?.length > 0 ? severityCount : ""
    }</summary>\n${risksList}\n`;
    return codeAnalysisContent;
  }

  buildCommentFrameworkResult(file: AnalysisFile): string {
    const CODE_BLOCK = "```";
    const errors = `Errors\n
${CODE_BLOCK}\n
${file?.output?.log?.stderr ?? file?.output?.initLog?.stderr}\n
${CODE_BLOCK}\n`;
    const output = `Output\n
${CODE_BLOCK}\n
${file?.output?.log?.stdout}\n
${CODE_BLOCK}\n`;
    const frameworkContent = `\n<details>
<summary>Terraform Log</summary>
${file?.output?.log?.stdout ? "<br>" + output + "<br>" : ""}
${file?.output?.log?.stderr ? "<br>" + errors + "<br>" : ""}
</details> <!-- End Format Logs -->\n`;
    return frameworkContent;
  }

  buildCommentSummary(
    filesToUpload: AnalysisFile[],
    results: AnalysisResult[]
  ): string {
    let risksTableContents = "";
    const riskArrays = results
      .filter((result) => result?.additions?.analysis_result?.length > 0)
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
            vendor: risk?.items[0].vendor
          };
        });
      });

    const mergedRisks = [].concat
      .apply([], riskArrays)
      .sort(
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
<td align="center"><img width="10" height="10" src="${this.assetsUrl}/${
        risk.riskSeverity
      }.svg" /></td>\n
<td align="center"><sub><img width="24" height="24" src="${this.assetsUrl}/${
        risk?.vendor.toLowerCase() ?? "aws"
      }.svg" /></sub></td>\n
<td>${Array.isArray(risk.folder) ? risk.folder.join(", ") : risk.folder}</td>\n
<td>${risk.riskTitle}</td>\n
</tr>\n`;
    });
    const risksSummary = `
\n
<div align="right">${
      count(mergedRisks, "riskSeverity", "critical") > 0
        ? `<img width="10" height="10" src="${this.assetsUrl}/critical.svg" />&nbsp;` +
          count(mergedRisks, "riskSeverity", "critical") +
          "&nbsp;Critical"
        : ""
    }${
      count(mergedRisks, "riskSeverity", "high") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/high.svg" />&nbsp;` +
          count(mergedRisks, "riskSeverity", "high") +
          "&nbsp;High"
        : ""
    }${
      count(mergedRisks, "riskSeverity", "medium") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/medium.svg" />&nbsp;` +
          count(mergedRisks, "riskSeverity", "medium") +
          "&nbsp;Medium"
        : ""
    }${
      count(mergedRisks, "riskSeverity", "low") > 0
        ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img width="10" height="10" src="${this.assetsUrl}/low.svg" />&nbsp;` +
          count(mergedRisks, "riskSeverity", "low") +
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
      (result) => result?.additions?.analysis_result?.length > 0
    )
      ? risksSummary + risksTable
      : "";
  }

  parseCodeAnalysis(
    filesToUpload: AnalysisFile[],
    analysisResults: AnalysisResult[]
  ): string {
    const commentBodyArray: any[] = [];
    const header = `<h2><sub><sub><img height="35" src="${this.assetsUrl}/algosec_logo.png" /></sub></sub>&nbsp; IaC Connectivity Risk Analysis</h2>\n`;
    const footer = `\n\n---\n\n
<br>
Pusher: @${this._context?.actor}<br>
Action: \`${this._context?.eventName}\`<br>
Working Directory: ${this.workspace}<br>
Workflow: ${this._context?.workflow}`;
    const summary = this.buildCommentSummary(filesToUpload, analysisResults);

    const bodyHeading = `\n**Detailed Risks Report**
---\n`;

    filesToUpload.forEach((file) => {
      const fileAnalysis = analysisResults.find((_fileAnalysis) =>
        _fileAnalysis?.proceeded_file?.includes(file.uuid)
      );
      commentBodyArray.push(
        this.buildCommentAnalysisBody(fileAnalysis?.additions, file)
      );
    });

    const analysisByFolder =
      commentBodyArray?.length > 0
        ? bodyHeading + commentBodyArray.join("\n\n---\n\n")
        : "\n\n<h4>No risks were found.</h4>\n\n";

    return header + summary + analysisByFolder + footer;
  }
}
