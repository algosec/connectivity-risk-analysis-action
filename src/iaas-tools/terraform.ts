import { exec, ExecResult } from "../common/exec";
import * as core from '@actions/core'
import { IFramework } from "./framework.model";
import { info } from "@actions/core";
import { existsSync } from "fs";


export class Terraform implements IFramework {
    constructor(_tfToken: string = '') {

    }

    async init(options: any){
        const terraformResult = await this.terraform(options)
            info(`##### Algosec ##### Step 2 - Terraform Result for folder ${options.runFolder}: ${JSON.stringify(terraformResult)}`)
    }

   
   async fmt(
        additionalTerraformOptions: string[] = [],
        ...options: string[]
    ): Promise<string> {
        core.debug(`Executing 'git clone' to directory with token and options '${options.join(' ')}'`);

        // const remote = this.getRepoRemoteUrl(token, ghRepository);
        let args = ['fmt', '--diff'];
        if (options.length > 0) {
            args = args.concat(options);
        }

        return this.cmd(additionalTerraformOptions, ...args);
    }

   async validate(
            additionalTerraformOptions: string[] = [],
            ...options: string[]
        ): Promise<string> {
            core.debug(`Executing 'git clone' to directory with token and options '${options.join(' ')}'`);

            // const remote = this.getRepoRemoteUrl(token, ghRepository);
            let args = ['fmt', '--diff'];
            if (options.length > 0) {
                args = args.concat(options);
            }

            return this.cmd(additionalTerraformOptions, ...args);
    }

   async plan(
        additionalTerraformOptions: string[] = [],
        ...options: string[]
    ): Promise<string> {
        core.debug(`Executing 'git clone' to directory with token and options '${options.join(' ')}'`);

        // const remote = this.getRepoRemoteUrl(token, ghRepository);
        let args = ['plan', '-input=false,  -no-color,  -out=/tmp/tf.out'];
        if (options.length > 0) {
            args = args.concat(options);
        }

        return this.cmd(additionalTerraformOptions, ...args);
    }

    async show(
        additionalTerraformOptions: string[] = [],
        ...options: string[]
    ): Promise<string> {
        core.debug(`Executing 'git clone' to directory with token and options '${options.join(' ')}'`);

        // const remote = this.getRepoRemoteUrl(token, ghRepository);
        let args = ['plan', '-input=false,  -no-color,  -out=/tmp/tf.out'];
        if (options.length > 0) {
            args = args.concat(options);
        }

        return this.cmd(additionalTerraformOptions, ...args);
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
}