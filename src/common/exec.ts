import { exec as actionsExec, ExecOutput } from '@actions/exec'
import { debug } from '@actions/core';

export interface AnalysisFile {
    uuid: string
    output: any
    folder: string
}
export interface ExecSteps { [name: string]: ExecOutput } 


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


export const count = (array, property, value) => array.filter((obj) => obj[property] === value).length;