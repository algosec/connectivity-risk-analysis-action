import { exec } from '@actions/exec';
import * as core from '@actions/core';


export abstract class Exec {
     async capture(cmd: string, args: string[]): Promise<ExecResult> {
        const res: ExecResult = {
            stdout: '',
            stderr: '',
            code: null,
        };
    
        try {
            const code = await exec(cmd, args, {
                listeners: {
                    stdout(data) {
                        res.stdout += data.toString();
                    },
                    stderr(data) {
                        res.stderr += data.toString();
                    },
                },
            });
            res.code = code;
            return res;
        } catch (err) {
            const msg = `Command '${cmd}' failed with args '${args.join(' ')}': ${res.stderr}: ${err}`;
            core.debug(`@actions/exec.exec() threw an error: ${msg}`);
            throw new Error(msg);
        }
     }

     abstract cmd(additionalOptions: string[], context: any, ...args: string[]): Promise<string>

}

interface ExecResult {
    stdout: string;
    stderr: string;
    code: number | null;
}




