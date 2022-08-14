import { Aws } from "./aws";

export interface ICloudProvider {
    init(): string
   
}

export class Azure implements ICloudProvider {
    init(): string {
        return 'Azure'
    }
}

export const cloudProviderMap = {
    aws: Aws,
    azure: Azure
}
export type CloudProviderMap = typeof cloudProviderMap;

export type CloudProviderKeys = keyof CloudProviderMap;

type Tuples<T> = T extends CloudProviderKeys ? [T, InstanceType<CloudProviderMap[T]>] : never;

export type ProviderSingleKeys<K> = [K] extends (K extends CloudProviderKeys ? [K] : never) ? K : never;

type ClassType<A extends CloudProviderKeys> = Extract<Tuples<CloudProviderKeys>, [A, any]>[1];

export class CloudProviderFactory {
    static getInstance<K extends CloudProviderKeys>(cloudProviderKey: ProviderSingleKeys<K>): ClassType<K> {
        return new cloudProviderMap[cloudProviderKey]()
    }
}

// const terraform = CloudProviderFactory.getInstance("terraform");
// const cloudformation = CloudProviderFactory.getInstance("cloudformation");

// console.log(
//   "IaS cloudProvider type: ",
//   new CloudProviderService().getInstanceByType("cloudformation")
// );
// console.log(
//     "IaS cloudProvider type: ",
//     new CloudProviderService().getInstanceByType("terraform")
//   );