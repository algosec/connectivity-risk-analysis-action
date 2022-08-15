import { exec, ExecResult } from "../common/exec";
import * as core from '@actions/core'
import { FrameworkKeys, IFramework } from "./framework.model";
import { info } from "@actions/core";
import { existsSync } from "fs";


export class Terraform implements IFramework {
    fileTypes = ['.tf']
    type: FrameworkKeys = 'terraform'
    constructor() {

    }

    init(options: any){
        return this
    }

    async terraform(options: any) {
        try {
          
            const steps: {[name: string]: ExecResult} = {}
            process.chdir(`${options.workDir}/${options.runFolder}`)
            // steps.setupVersion = await exec('curl', ['-L', 'https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh', '|', 'bash']);
            // info('##### Algosec ##### tfswitch Installed successfully')
            // if (process?.env?.TF_VERSION == "latest"  || process?.env?.TF_VERSION  == ""){
            //   steps.switchVersion = await exec('tfswitch', ['--latest']);
            // } else {
            //   steps.switchVersion = await exec('tfswitch', []);
            // }
            info('##### Algosec ##### tfswitch version: ' + process?.env?.TF_VERSION)
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
          if (error instanceof Error) console.log(error.message) //setFailed(error.message)
        }
      }

    
    async check(foldersToRunCheck: any, workDir: string) {
        const res = []
        const asyncIterable = async (iterable, action) => {
            for (const [index, value] of iterable.entries()) {
              const output = await action({runFolder: value, workDir})
              res.push({folder:value, output})
              info(`##### Algosec ##### Step 2.${index}- ${this.type} Result for folder ${value}: ${JSON.stringify(this)}`)
            }
          }
          try {
            await asyncIterable(foldersToRunCheck, this.terraform)
            
          } catch (error) {
            info('Framework check failed '+error)
          }
          return res
    }
    
}