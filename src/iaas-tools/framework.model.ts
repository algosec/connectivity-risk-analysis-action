import { Terraform } from "./terraform";

export interface IFramework {
    fileTypes: string[]
    init(options?: any): any
    check(foldersToRunCheck: any, workDir: any)
   
}

export class CloudFormation implements IFramework {

    fileTypes = ['json', 'yaml']
    init(): string {
        return 'CloudFormation'
    }
    check(foldersToRunCheck: any, workDir: any) {
        
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
    static getInstance<K extends FrameworkKeys>(frameworkKey: FrameworkSingleKeys<K>): FrameworkClassType<K> {
        return new frameworkMap[frameworkKey]()
    }
}



// const terraform = FrameworkFactory.getInstance("terraform");
// const cloudformation = FrameworkFactory.getInstance("cloudformation");

// console.log(
//   "IaS framework type: ",
//   new FrameworkService().getInstanceByType("cloudformation")
// );
// console.log(
//     "IaS framework type: ",
//     new FrameworkService().getInstanceByType("terraform")
//   );