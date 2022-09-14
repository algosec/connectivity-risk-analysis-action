import {
  VersionControlKeys,
  VersionControlSingleKeys,
  VersionControlFactory,
} from "./vcs.model";

export class VersionControlService {
  getInstanceByType<K extends VersionControlKeys>(
    type: VersionControlSingleKeys<K>
  ) {
    try{
      return VersionControlFactory.getInstance(type);
    } catch(e){
      throw new Error(e);
    }
  }
}
