import { Terraform } from "./terraform";

export interface IFramework {
    init(options?: any): any
   
}

export class CloudFormation implements IFramework {
    init(): string {
        return 'CloudFormation'
    }
}

export const frameworkMap = {
    terraform: Terraform,
    cloudformation: CloudFormation
}
export type FrameworkMap = typeof frameworkMap;

export type FrameworkKeys = keyof FrameworkMap;

type Tuples<T> = T extends FrameworkKeys ? [T, InstanceType<FrameworkMap[T]>] : never;

export type FrameworkSingleKeys<K> = [K] extends (K extends FrameworkKeys ? [K] : never) ? K : never;

type ClassType<A extends FrameworkKeys> = Extract<Tuples<FrameworkKeys>, [A, any]>[1];





export class FrameworkFactory {
    static getInstance<K extends FrameworkKeys>(frameworkKey: FrameworkSingleKeys<K>): ClassType<K> {
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