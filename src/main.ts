
import { exec } from 'child_process'
import {AshCodeAnalysis} from './code-analysis'
import { ExecSteps, AnalysisFile } from './common/exec'
import { FrameworkKeys, IFramework } from './iaas-tools/framework.model'
import { FrameworkService } from './iaas-tools/framework.service'
import { IVersionControl, VersionControlKeys } from './vcs/vcs.model'
import { VersionControlService } from './vcs/vcs.service'
// import { 
//     codeAnalysisMock as codeAnalysisResponses, 
//     terraformPlanFileMock as filesToAnalyze
// } from "../test/mockData.folder-error"

export class Main {
    steps: ExecSteps = {}
    frameworkType: FrameworkKeys
    vcsType: VersionControlKeys

    constructor(){
        this.vcsType = process?.env?.VCS_TYPE as VersionControlKeys
        this.frameworkType = process?.env?.FRAMEWORK_TYPE as FrameworkKeys        
    }

    async run(): Promise<void> {
        try {
          const vcs: IVersionControl =  new VersionControlService().getInstanceByType(this.vcsType)
          const framework: IFramework =  new FrameworkService().getInstanceByType(this.frameworkType, vcs)
          const codeAnalyzer = new AshCodeAnalysis(vcs)
          await codeAnalyzer.init()
          if (codeAnalyzer.debugMode) {
            await exec(`rimraf ${vcs.workDir}`)
          }
            const foldersToRunCheck = await vcs.checkForDiffByFileTypes(framework.fileTypes)
            if (foldersToRunCheck) {
              const filesToAnalyze: AnalysisFile[] = await framework.check(foldersToRunCheck, vcs.workDir)
                if (filesToAnalyze){
                    const codeAnalysisResponses = await codeAnalyzer.analyze(filesToAnalyze)
                    if (codeAnalysisResponses?.length > 0){
                        await vcs.parseOutput(filesToAnalyze, codeAnalysisResponses)
                    }
                }
            }
        } catch (_e) {
            console.log(_e)
        }
    
    }

}