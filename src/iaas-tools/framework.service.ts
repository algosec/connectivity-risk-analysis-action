
import { IVersionControl } from '../vcs/vcs.model'
import {FrameworkKeys, FrameworkSingleKeys, FrameworkFactory} from './framework.model'

export class FrameworkService {

    getInstanceByType<K extends FrameworkKeys>(type: FrameworkSingleKeys<K>, vcs: IVersionControl){
        return FrameworkFactory.getInstance(type, vcs)
    }
}
