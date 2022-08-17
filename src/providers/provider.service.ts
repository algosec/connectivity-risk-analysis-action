
import {CloudProviderKeys, ProviderSingleKeys, CloudProviderFactory} from './provider.model'
export class CloudProviderService {

    getInstanceByType<K extends CloudProviderKeys>(type: ProviderSingleKeys<K>){
        return CloudProviderFactory.getInstance(type)
    }
}

