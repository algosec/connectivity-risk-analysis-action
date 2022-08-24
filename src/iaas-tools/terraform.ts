import { exec, ExecSteps, AnalysisFile } from "../common/exec";
import { FrameworkKeys, IFramework } from "./framework.model";
import { existsSync } from "fs";
import getUuidByString from "uuid-by-string";
import { IVersionControl } from "../vcs/vcs.model";

export class Terraform implements IFramework {
    fileTypes = ['.tf']
    type: FrameworkKeys = 'terraform'
    steps: ExecSteps = {}
    constructor(public vcs: IVersionControl) {
        this.steps = {}
    }

    async terraform(options: any) {
        const steps: ExecSteps = {}
        try {
          
            process.chdir(`${options.workDir}/${options.runFolder}`)
          
            steps.init = await exec('terraform', ['init']);
      
            steps.fmt = await exec('terraform', ['fmt', '-diff'])
            steps.validate = await exec('terraform', ['validate', '-no-color'])
            if (!existsSync('./tmp')) {
              await exec('mkdir', ['tmp'])
            }
            steps.plan = await exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process?.cwd()}\\tmp\\tf-${options.runFolder}.out`])
            const initLog = {
              stdout: steps.init.stdout.concat(steps.fmt.stdout, steps.validate.stdout, steps.plan.stdout),
              stderr: steps.init.stderr.concat(steps.fmt.stderr, steps.validate.stderr, steps.plan.stderr)
            }
            let jsonPlan = {};
            if (steps.plan.stdout){
              jsonPlan = JSON.parse((await exec('terraform', ['show', '-json', `${process?.cwd()}\\tmp\\tf-${options.runFolder}.out`])).stdout)
            }
            process.chdir(options.workDir)
            return {plan: jsonPlan, log: steps.plan, initLog};
        } catch (error: any) {
          if (error instanceof Error) {
            console.log(error?.message) //setFailed(error?.message)
            return {log: {stderr: error?.message}}
          }
        }
    }

    async setVersion(steps){
        steps.setupVersion = await exec('curl', ['-L', 'https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh', '|', 'bash']);
        console.log('##### Algosec ##### tfswitch Installed successfully')
        if (process?.env?.TF_VERSION == "latest"  || process?.env?.TF_VERSION  == ""){
          steps.switchVersion = await exec('tfswitch', ['--latest']);
        } else {
          steps.switchVersion = await exec('tfswitch', []);
        }
        console.log('##### Algosec ##### tfswitch version: ' + process?.env?.TF_VERSION)
    }

    async check(foldersToRunCheck: string[], workDir: string): Promise<AnalysisFile[]> {
        const res = []
        const asyncIterable = async (iterable, action) => {
            for (const [index, value] of iterable?.entries()) {
              const output = await action({runFolder: value, workDir})
              const file: AnalysisFile = {
                uuid: getUuidByString(value),
                folder:value, 
                output
              }
              res.push(file)
              console.log(`##### Algosec ##### Step 3${iterable?.entries()?.length > 1 ? '.'+index+1 : ''} - ${this.type} Result for folder ${file.folder}: ${JSON.stringify(file)}`)
            } 
          }
          try {
            await asyncIterable(foldersToRunCheck, this.terraform)
            
          } catch (error) {
            console.log('Framework check failed '+error)
          }
          console.log(`Files To Analyze ${JSON.stringify(res)}`)
          return res
    }
    
}