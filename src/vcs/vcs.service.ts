
import {VersionControlKeys, VersionControlSingleKeys, VersionControlFactory} from './vcs.model'

export class VersionControlService {

    getInstanceByType<K extends VersionControlKeys>(type: VersionControlSingleKeys<K>){
        return VersionControlFactory.getInstance(type).init()
    }
}