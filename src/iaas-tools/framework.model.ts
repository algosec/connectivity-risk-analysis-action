import { IVersionControl, ExecOutput } from "../vcs/vcs.model";
import { Terraform } from "./terraform";

export interface IFramework {
  type: FrameworkKeys;
  fileTypes: string[];
  check: (foldersToRunCheck: string[], workDir: string) => any;
}

export const frameworkMap = {
  terraform: Terraform,
};

export interface FrameworkOptions {
  runFolder: string;
  workDir: string;
  path: string;
}

export interface FrameworkResult {
  plan: string;
  log: ExecOutput;
  initLog: ExecOutput;
}

export type FrameworkMap = typeof frameworkMap;

export type FrameworkKeys = keyof FrameworkMap;

export type FrameworkTuples<T> = T extends FrameworkKeys
  ? [T, InstanceType<FrameworkMap[T]>]
  : never;

export type FrameworkSingleKeys<K> = [K] extends (
  K extends FrameworkKeys ? [K] : never
)
  ? K
  : never;

export type FrameworkClassType<A extends FrameworkKeys> = Extract<
  FrameworkTuples<FrameworkKeys>,
  [A, any]
>[1];
export class FrameworkFactory {
  static getInstance<K extends FrameworkKeys>(
    frameworkKey: FrameworkSingleKeys<K>,
    vcs: IVersionControl
  ): FrameworkClassType<K> {
    try {
      return new frameworkMap[frameworkKey](vcs);
    } catch (error) {
      throw new Error("Unsupported framework type: " + frameworkKey);
    }
  }
}
