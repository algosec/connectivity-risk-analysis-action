import { exec as actionsExec, ExecOutput } from '@actions/exec'
import { debug } from '@actions/core';

export interface FileAnalysis {
    file: any
    uuid: string
    output: any
}
export interface ExecSteps { [name: string]: ExecOutput } 
export class Exec {
    //  async capture(cmd: string, args: string[]): Promise<ExecOutput> {
    //     const res: ExecOutput = {
    //         stdout: '',
    //         stderr: '',
    //         exitCode: null,
    //     };
    
    //     try {
    //         const code = await exec(cmd, args, {
    //             listeners: {
    //                 stdout(data) {
    //                     res.stdout += data.toString();
    //                 },
    //                 stderr(data) {
    //                     res.stderr += data.toString();
    //                 },
    //             },
    //         });
    //         res.exitCode = code;
    //         return res;
    //     } catch (err) {
    //         const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
    //         core.debug(`@actions/exec.exec() threw an error: ${msg}`);
    //         throw new Error(msg);
    //     }
    //  }

    //  abstract cmd(additionalOptions: string[], context: any, ...args: string[]): Promise<string>

}



export async function exec(cmd: string, args: string[]): Promise<ExecOutput> {
    const res: ExecOutput = {
        stdout: '',
        stderr: '',
        exitCode: null,
    };
  
    try {
        const code = await actionsExec(cmd, args, {
            listeners: {
                stdout(data) {
                    res.stdout += data.toString();
                },
                stderr(data) {
                    res.stderr += data.toString();
                },
            },
        });
        
        res.exitCode = code;
        return res;
    } catch (err) {
        const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
        debug(`##### Algosec ##### @actions/exec.exec() threw an error: ${msg}`);
        throw new Error(msg);
    }
}
