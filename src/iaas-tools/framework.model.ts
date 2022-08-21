import { IVersionControl } from "../vcs/vcs.model";
import { Terraform } from "./terraform";

export interface IFramework {
    type: FrameworkKeys
    fileTypes: string[]
    check(foldersToRunCheck: any, workDir: any)
   
}

export class CloudFormation implements IFramework {
    type: FrameworkKeys = 'cloudformation'
    fileTypes = ['json', 'yaml']
    check(foldersToRunCheck: any, workDir: any) {
    }

    constructor(public vcs: IVersionControl) {
    }
}

export const frameworkMap = {
    terraform: Terraform,
    cloudformation: CloudFormation
}

export type FrameworkMap = typeof frameworkMap;

export type FrameworkKeys = keyof FrameworkMap;

export type FrameworkTuples<T> = T extends FrameworkKeys ? [T, InstanceType<FrameworkMap[T]>] : never;

export type FrameworkSingleKeys<K> = [K] extends (K extends FrameworkKeys ? [K] : never) ? K : never;

export type FrameworkClassType<A extends FrameworkKeys> = Extract<FrameworkTuples<FrameworkKeys>, [A, any]>[1];
export class FrameworkFactory {
    static getInstance<K extends FrameworkKeys>(frameworkKey: FrameworkSingleKeys<K>, vcs: IVersionControl): FrameworkClassType<K> {
        return new frameworkMap[frameworkKey](vcs)
    }
}

