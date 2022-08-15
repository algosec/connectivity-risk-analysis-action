import { Github } from "./github";

export interface IVersionControl {
    workspace: string
    token: string
    sha: string
    octokit?: any
    createComment(body: string)
    parseCodeAnalysis(analysis, VersionControl)
    init(): any
    getDiff(vcsObject)
   
}

export class GitLab implements IVersionControl {
    workspace: string
    token: string
    sha: string

    constructor(){
        this.workspace = process?.env?.GITLAB_WORKSPACE
        this.token =  process?.env?.GITLAB_TOKEN 
        this.sha =  process?.env?.GITLAB_SHA 
    }
    init(): string {
        return 'GitLab'
    }

    getDiff(client){

    }

    createComment(options){

    }

    parseCodeAnalysis(analysis, VersionControl){

    }
}

export const versionControlMap = {
    github: Github,
    gitlab: GitLab
}
export type VersionControlMap = typeof versionControlMap;

export type VersionControlKeys = keyof VersionControlMap;

type VersionControlTuples<T> = T extends VersionControlKeys ? [T, InstanceType<VersionControlMap[T]>] : never;

export type VersionControlSingleKeys<K> = [K] extends (K extends VersionControlKeys ? [K] : never) ? K : never;

type VersionControlClassType<A extends VersionControlKeys> = Extract<VersionControlTuples<VersionControlKeys>, [A, any]>[1];





export class VersionControlFactory {
    static getInstance<K extends VersionControlKeys>(versionControlKey: VersionControlSingleKeys<K>): VersionControlClassType<K> {
        return new versionControlMap[versionControlKey]()
    }
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