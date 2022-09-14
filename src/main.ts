import { exec } from "child_process";
import { AshCodeAnalysis } from "./code-analysis";
import { ExecSteps, AnalysisFile } from "./common/exec";
import { FrameworkKeys, IFramework } from "./iaas-tools/framework.model";
import { FrameworkService } from "./iaas-tools/framework.service";
import { IVersionControl, VersionControlKeys } from "./vcs/vcs.model";
import { VersionControlService } from "./vcs/vcs.service";
// import {
//     codeAnalysisResponses,
//     filesToAnalyze
// } from "../test/mockData.gcp"

export class Main {
  steps: ExecSteps = {};
  frameworkType: FrameworkKeys;
  vcsType: VersionControlKeys;

  constructor() {
    this.vcsType = (process?.env?.VCS ?? 'github') as VersionControlKeys;
    this.frameworkType = (process?.env?.FRAMEWORK ?? 'terraform') as FrameworkKeys;
  }

  async run(): Promise<void> {
    try {
      const vcs: IVersionControl =
        new VersionControlService().getInstanceByType(this.vcsType);
      const framework: IFramework | null = new FrameworkService().getInstanceByType(
        this.frameworkType,
        vcs
      );
      const codeAnalyzer = new AshCodeAnalysis(vcs);
      const isInitilizaed = await codeAnalyzer.init();
      if (codeAnalyzer.debugMode) {
        await exec(`rimraf ${vcs.workDir}`);
      }
      let foldersToRunCheck = []
      if (isInitilizaed && framework) {
        foldersToRunCheck = await vcs.checkForDiffByFileTypes(
          framework.fileTypes
        );
      } else {
        vcs.logger.exit()
      }
      if (foldersToRunCheck?.length > 0) {
        const filesToAnalyze: AnalysisFile[] = await framework?.check(
          foldersToRunCheck,
          vcs.workDir
        );
        if (filesToAnalyze?.length > 0 ) {
          const codeAnalysisResponses = await codeAnalyzer.analyze(
            filesToAnalyze
          );
          if (codeAnalysisResponses?.length > 0) {
            await vcs.parseOutput(filesToAnalyze, codeAnalysisResponses);
          }
        }else {
          vcs.logger.exit('- ##### IAC Connectivity Risk Analysis ##### NO FILES TO ANALYZE')
        }
      }
    } catch (_e) {
      console.log(_e);
    }
  }
}
