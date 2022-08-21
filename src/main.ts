
import { exec } from 'child_process'
import {AshCodeAnalysis} from './code-analysis'
import { ExecSteps, FileAnalysis } from './common/exec'
import { FrameworkKeys, IFramework } from './iaas-tools/framework.model'
import { FrameworkService } from './iaas-tools/framework.service'
import { IVersionControl, VersionControlKeys } from './vcs/vcs.model'
import { VersionControlService } from './vcs/vcs.service'


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
          if (codeAnalyzer.debugMode) {
            await exec(`rimraf ${vcs.workDir}`)
          }
          const foldersToRunCheck = await vcs.checkForDiffByFileTypes()
          if (foldersToRunCheck) {
            const filesToAnalyze: FileAnalysis[] = await framework.check(foldersToRunCheck, vcs.workDir)
            if (filesToAnalyze){
                const codeAnalysisResponses = await codeAnalyzer.analyze(filesToAnalyze)
                if (codeAnalysisResponses){
                    await vcs.parseOutput(filesToAnalyze, codeAnalysisResponses)
                }
            }
          }
          
          // const foldersToRunCheck = ['tf-test']
          // const filesToAnalyze = terraformSinglePlanFileMock
          // const codeAnalysisResponse = codeAnalysisMock as any
          
        } catch (_e) {
            console.log(_e)
        }
    
    }

}