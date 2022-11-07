import { existsSync } from "fs";
import { exec as actionsExec } from "@actions/exec";

const exec = async (cmd: string, args: string[]): Promise<any> => {
  const res = {
    stdout: "",
    stderr: "",
    exitCode: 0,
  };

  try {
    const code = await actionsExec(cmd, args, {
      listeners: {
        stdout(data) { res.stdout += data.toString(); },
        stderr(data) { res.stderr += data.toString(); },
      }
    });

    res.exitCode = code;
    console.log(`Command: ${cmd}, result: ${JSON.stringify(res)}`);
    return res;
  } catch (err) {
    const msg = `Command '${cmd}' failed with args '${args.join(" ")}': ${res.stderr}: ${err}`;
    throw new Error(msg);
  }
};

const updateTerraformVersion = async() => {
    await exec("tfswitch", [`--${process?.env?.TF_VERSION || 'latest'}`]);
    await exec("terraform", ["-v"]);
};

export const terraform = async(): Promise<any> => {
    const folderToRun = 'tf-test-aws-gcp-azure';
    const planOutputFile = `${process?.cwd()}/tmp/terraform.out`;

    await updateTerraformVersion();

    try {
      process.chdir(folderToRun);
      await exec("terraform", ["init"]);
      await exec("terraform", ["fmt", "-diff"]);
      await exec("terraform", ["validate", "-no-color"]);
      if (!existsSync("./tmp")) {
        await exec("mkdir", ["tmp"]);
      }
      await exec("terraform", ["plan", "-input=false", "-no-color", `-out=${planOutputFile}`]);
      await exec("terraform", ["show", "-json", planOutputFile]);
    } catch (error: any) {
        console.error(`terraform failed to run. Details: ${error?.message}`);
    }
}