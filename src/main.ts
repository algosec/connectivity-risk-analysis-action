
import { AshCodeAnalysis } from "./code-analysis";
import { RiskAnalysisFile } from "./common/risk.model";
import { FrameworkKeys, IFramework } from "./iaas-tools/framework.model";
import { FrameworkService } from "./iaas-tools/framework.service";
import { IVersionControl, VersionControlKeys } from "./vcs/vcs.model";
import { VersionControlService } from "./vcs/vcs.service";
export class Main {
  frameworkType: FrameworkKeys;
  vcsType: VersionControlKeys;

  constructor() {
    this.vcsType = 'github' as VersionControlKeys//(process?.env?.VCS ?? 'github') as VersionControlKeys;
    this.frameworkType = 'terraform' as FrameworkKeys //(process?.env?.FRAMEWORK ?? 'terraform') as FrameworkKeys;
  }

  async run(): Promise<void> {
    try {
      const vcs: IVersionControl = await
        new VersionControlService().getInstanceByType(this.vcsType);
      const framework: IFramework | null = await new FrameworkService().getInstanceByType(
        this.frameworkType,
        vcs
      );
      const codeAnalyzer = await new AshCodeAnalysis(vcs);
      const isInitilizaed = await codeAnalyzer.init();
      if (codeAnalyzer.debugMode) {
        // await vcs.exec(`rimraf ${vcs.workDir}`);
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
        const filesToAnalyze: RiskAnalysisFile[] = await framework?.check(
          foldersToRunCheck,
          vcs.workDir
        );
        if (filesToAnalyze?.length > 0 ) {
          const codeAnalysisResponses = await codeAnalyzer.analyze(
            filesToAnalyze
          );
          // if (codeAnalysisResponses?.length > 0) {
            await vcs.parseOutput(filesToAnalyze, codeAnalysisResponses);
          // }
        }else {
          vcs.logger.exit('No files to analyze')
        }
      }
    } catch (_e) {
      throw new Error(_e);
      
    }
  }
}
