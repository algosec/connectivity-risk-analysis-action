import { IVersionControl } from "../vcs/vcs.model";
import {
  FrameworkKeys,
  FrameworkSingleKeys,
  FrameworkFactory,
} from "./framework.model";

export class FrameworkService {
  getInstanceByType<K extends FrameworkKeys>(
    type: FrameworkSingleKeys<K>,
    vcs: IVersionControl
  ) {
    try{
      return FrameworkFactory.getInstance(type, vcs);
    } catch(e){
      throw new Error(e);
    }
  }
}
