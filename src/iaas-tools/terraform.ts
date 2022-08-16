import { exec, ExecResult } from "../common/exec";
import * as core from '@actions/core'
import { FrameworkKeys, IFramework } from "./framework.model";
import { info } from "@actions/core";
import { existsSync } from "fs";
import getUuidByString from "uuid-by-string";


export class Terraform implements IFramework {
    fileTypes = ['.tf']
    type: FrameworkKeys = 'terraform'
    steps: {[name: string]: ExecResult} = {}
    constructor() {

    }

    init(options: any){
        return this
    }

    async terraform(options: any) {
        try {
          
            process.chdir(`${options.workDir}/${options.runFolder}`)
            // this.steps.setupVersion = await exec('curl', ['-L', 'https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh', '|', 'bash']);
            // info('##### Algosec ##### tfswitch Installed successfully')
            // if (process?.env?.TF_VERSION == "latest"  || process?.env?.TF_VERSION  == ""){
            //   this.steps.switchVersion = await exec('tfswitch', ['--latest']);
            // } else {
            //   this.steps.switchVersion = await exec('tfswitch', []);
            // }
            info('##### Algosec ##### tfswitch version: ' + process?.env?.TF_VERSION)
            this.steps.init = await exec('terraform', ['init']);
      
            this.steps.fmt = await exec('terraform', ['fmt', '-diff'])
            this.steps.validate = await exec('terraform', ['validate', '-no-color'])
            if (!existsSync('./tmp')) {
              await exec('mkdir', ['tmp'])
            }
            this.steps.plan = await exec('terraform', ['plan', '-input=false', '-no-color', `-out=${process?.cwd()}\\tmp\\tf-${options.runFolder}.out`])
            const initLog = {
              stdout: this.steps.init.stdout.concat(this.steps.fmt.stdout, this.steps.validate.stdout, this.steps.plan.stdout),
              stderr: this.steps.init.stderr.concat(this.steps.fmt.stderr, this.steps.validate.stderr, this.steps.plan.stderr)
            }
            let jsonPlan = {};
            if (this.steps.plan.stdout){
              jsonPlan = JSON.parse((await exec('terraform', ['show', '-json', `${process?.cwd()}\\tmp\\tf-${options.runFolder}.out`])).stdout)
            }
            process.chdir(options.workDir)
            return {plan: jsonPlan, log: this.steps.plan, initLog};
        } catch (error: any) {
          if (error instanceof Error) console.log(error.message) //setFailed(error.message)
        }
      }

    
    async check(foldersToRunCheck: any, workDir: string) {
        const res = []
        const asyncIterable = async (iterable, action) => {
            for (const [index, value] of iterable?.entries()) {
              const output = await action({runFolder: value, workDir})
              res.push({uuid: getUuidByString(value),folder:value, output})
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