import { Exec } from "../common/exec";
import * as core from '@actions/core'
import { IaaS } from "./iaas.model";


export class TerraformIaaS implements IaaS {

    constructor(_tfToken: string = '') {
    }
    async init(
            additionalTerraformOptions: string[] = [],
            ...options: string[]
        ): Promise<string> {
            
            core.debug(`Executing 'git clone' to directory with token and options '${options.join(' ')}'`);
        
            // const remote = this.getRepoRemoteUrl(token, ghRepository);
            let args = ['init'];
            if (options.length > 0) {
                args = args.concat(options);
            }
        
            return this.cmd(additionalTerraformOptions, ...args);
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

    async cmd(additionalTerraformOptions: string[], ...args: string[]): Promise<string> {
        core.debug(`Executing Git: ${args.join(' ')}`);
        // const serverUrl = this.getServerUrl(context.payload.repository?.html_url);
        const userArgs = [
            ...additionalTerraformOptions,
        ];
        const res = await this.capture('terraform', userArgs.concat(args));
        if (res.code !== 0) {
            throw new Error(`Command 'terraform ${args.join(' ')}' failed: ${JSON.stringify(res)}`);
        }
        return res.stdout;
      }
}