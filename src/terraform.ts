import { Exec } from "./exec";
import * as core from '@actions/core'


export class TerraformExec extends Exec {

    
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