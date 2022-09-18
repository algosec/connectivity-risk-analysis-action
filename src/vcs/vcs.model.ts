import { RiskAnalysisFile } from "../common/risk.model";
import { Github } from "./github";

export interface ExecSteps {
  [name: string]: ExecOutput;
}
export interface IVersionControl {
  exec;
  steps: ExecSteps;
  pullRequest: any;
  payload: any;
  repo: any;
  logger: Logger;
  http: any;
  workspace: string;
  workDir: string;
  token: string;
  sha: string;
  octokit?: any;
  fileTypes: string[];
  cfApiUrl: string;
  actionUuid: string;
  getRepoRemoteUrl: () => string;
  createComment: (body: string) => any;
  parseCodeAnalysis: (analysis, VersionControl) => any;
  getDiff: (vcsObject) => any;
  checkForDiffByFileTypes: (fileTypes: string[]) => any;
  parseOutput: (filesToUpload: RiskAnalysisFile[], analysisResult, error?: string) => any;
  uploadAnalysisFile: (file: RiskAnalysisFile, jwt: string) => any;
  getInputs: () => any;
}



export const versionControlMap = {
  github: Github
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

export type VersionControlClassType<A extends VersionControlKeys> = Extract<
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

export interface ExecOutput {
  /**The exit code of the process */
  exitCode: number;
  /**The entire stdout of the process as a string */
  stdout: string;
  /**The entire stderr of the process as a string */
  stderr: string;
}