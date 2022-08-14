import { Github } from "./github";

export interface IVersionControl {
    init(): string
   
}

export class GitLab implements IVersionControl {
    init(): string {
        return 'GitLab'
    }
}

export const versionControlMap = {
    github: Github,
    gitlab: GitLab,
}
export type VersionControlMap = typeof versionControlMap;

export type VersionControlKeys = keyof VersionControlMap;

type Tuples<T> = T extends VersionControlKeys ? [T, InstanceType<VersionControlMap[T]>] : never;

export type VersionControlSingleKeys<K> = [K] extends (K extends VersionControlKeys ? [K] : never) ? K : never;

type ClassType<A extends VersionControlKeys> = Extract<Tuples<VersionControlKeys>, [A, any]>[1];





export class VersionControlFactory {
    static getInstance<K extends VersionControlKeys>(versionControlKey: VersionControlSingleKeys<K>): ClassType<K> {
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