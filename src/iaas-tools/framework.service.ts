
import {FrameworkKeys, FrameworkSingleKeys, FrameworkFactory} from './framework.model'

export class FrameworkService {

    getInstanceByType<K extends FrameworkKeys>(type: FrameworkSingleKeys<K>){
        return FrameworkFactory.getInstance(type).init()
    }
}
