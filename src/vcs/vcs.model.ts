import { AnalysisFile } from "../common/exec";
import { Github } from "./github";

export interface IVersionControl {
  pullRequest: any;
  payload: any;
  repo: any;
  logger: any;
  http: any;
  workspace: string;
  workDir: string;
  token: string;
  sha: string;
  octokit?: any;
  fileTypes: string[];
  cfApiUrl: string;
  getRepoRemoteUrl: () => string;
  createComment: (body: string) => any;
  parseCodeAnalysis: (analysis, VersionControl) => any;
  getDiff: (vcsObject) => any;
  checkForDiffByFileTypes: (fileTypes: string[]) => any;
  parseOutput: (filesToUpload: AnalysisFile[], analysisResult) => any;
  uploadAnalysisFile: (file: AnalysisFile, jwt: string) => any;
  getInputs: () => any;
}

export class GitLab implements IVersionControl {
  pullRequest: any;
  payload: any;
  repo: any;
  logger: Logger;
  http: any;
  workspace: string;
  token: string;
  sha: string;
  workDir: string;
  fileTypes: string[];
  cfApiUrl: string;

  constructor() {
    this.workspace = process?.env?.GITLAB_WORKSPACE ?? "";
    this.token = process?.env?.GITLAB_TOKEN ?? "";
    this.sha = process?.env?.GITLAB_SHA ?? "";
  }

  getInputs(): void {}

  getDiff(client): void {}

  createComment(options): void {}

  parseCodeAnalysis(analysis: any, VersionControl: any): void {}

  getRepoRemoteUrl(): string {
    return "";
  }

  checkForDiffByFileTypes(fileTypes: string[]): void {}

  parseOutput(filesToUpload, analysisResult): void {}

  uploadAnalysisFile(file: AnalysisFile, jwt: string): any {}
}

export const versionControlMap = {
  github: Github,
  gitlab: GitLab,
};
export type VersionControlMap = typeof versionControlMap;

export type VersionControlKeys = keyof VersionControlMap;

type VersionControlTuples<T> = T extends VersionControlKeys
  ? [T, InstanceType<VersionControlMap[T]>]
  : never;

export type VersionControlSingleKeys<K> = [K] extends (
  K extends VersionControlKeys ? [K] : never
)
  ? K
  : never;

type VersionControlClassType<A extends VersionControlKeys> = Extract<
  VersionControlTuples<VersionControlKeys>,
  [A, any]
>[1];

export class VersionControlFactory {
  static getInstance<K extends VersionControlKeys>(
    versionControlKey: VersionControlSingleKeys<K>
  ): VersionControlClassType<K> {
    return new versionControlMap[versionControlKey]();
  }
}

export interface Logger {
  info: Function;
  error: Function;
  debug: Function;
  exit: Function;
}

// const terraform = VersionControlFactory.getInstance("terraform");
// const cloudformation = VersionControlFactory.getInstance("cloudformation");

// console.log(
//   "IaS versionControl type: ",
//   new VersionControlService().getInstanceByType("cloudformation")
// );
// console.log(
//     "IaS versionControl type: ",
//     new VersionControlService().getInstanceByType("terraform")
//   );
