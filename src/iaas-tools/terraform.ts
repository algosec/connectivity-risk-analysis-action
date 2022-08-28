import { exec, ExecSteps, AnalysisFile } from "../common/exec";
import {
  FrameworkKeys,
  FrameworkOptions,
  FrameworkResult,
  IFramework,
} from "./framework.model";
import { existsSync } from "fs";
import getUuidByString from "uuid-by-string";
import { IVersionControl } from "../vcs/vcs.model";
import { ExecOutput } from "@actions/exec";

export class Terraform implements IFramework {
  fileTypes = [".tf"];
  type: FrameworkKeys = "terraform";
  steps: ExecSteps = {};
  constructor(public vcs: IVersionControl) {
    this.steps = {};
  }

  async terraform(options: FrameworkOptions): Promise<FrameworkResult> {
    let result: FrameworkResult = {plan: {}, log: {stderr: '', stdout: '', exitCode: 0}, initLog: {stderr: '', stdout: '', exitCode: 0}}
    const steps: ExecSteps = {};
    const initLog: ExecOutput = {stdout: '', stderr: '', exitCode: 0};
    try {
      process.chdir(`${options.workDir}/${options.runFolder}`);
      console.log(`::group:: Run Terraform on folder ${options.runFolder}`)
      steps.init = await exec("terraform", ["init"]);
      // console.log(`::endgroup::\n::group:: Format Terraform on folder ${options.runFolder}\n`)
      steps.fmt = await exec("terraform", ["fmt", "-diff"]);
      // console.log(`::endgroup::\n::group:: Validate Terraform on folder ${options.runFolder}\n`)
      steps.validate = await exec("terraform", ["validate", "-no-color"]);
      // console.log(`::endgroup::\n::group:: Plan Terraform on folder ${options.runFolder}\n`)
      if (!existsSync("./tmp")) {
        await exec("mkdir", ["tmp"]);
      }
      steps.plan = await exec("terraform", [
        "plan",
        "-input=false",
        "-no-color",
        `-out=${process?.cwd()}\\tmp\\tf-${options.runFolder}.out`,
      ]);
      // console.log(`::endgroup::\n::group:: Show Terraform on folder ${options.runFolder}\n`)
      const initLog = {
        exitCode: 0,
        stdout: steps.init.stdout.concat(
          steps.fmt.stdout,
          steps.validate.stdout,
          steps.plan.stdout
        ),
        stderr: steps.init.stderr.concat(
          steps.fmt.stderr,
          steps.validate.stderr,
          steps.plan.stderr
        ),
      };
      let jsonPlan = {};
      if (steps.plan.stdout) {
        jsonPlan = JSON.parse(
          (
            await exec("terraform", [
              "show",
              "-json",
              `${process?.cwd()}\\tmp\\tf-${options.runFolder}.out`,
            ])
          ).stdout
        );
      }
      console.log(`::endgroup::`)
      process.chdir(options.workDir);
      result = { plan: jsonPlan, log: steps.plan, initLog };
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(error?.message); // setFailed(error?.message)
        result = { plan: {}, log: { stderr: error?.message, stdout: '', exitCode:0  },  initLog };
      }
    }
    return result
  }

  async setVersion(steps: ExecSteps): Promise<void> {
    steps.setupVersion = await exec("curl", [
      "-L",
      "https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh",
      "|",
      "bash",
    ]);
    console.log("##### IAC Connectivity Risk Analysis ##### tfswitch Installed successfully");
    if (
      process?.env?.TF_VERSION == "latest" ||
      process?.env?.TF_VERSION == ""
    ) {
      steps.switchVersion = await exec("tfswitch", ["--latest"]);
    } else {
      steps.switchVersion = await exec("tfswitch", []);
    }
    console.log(
      "##### IAC Connectivity Risk Analysis ##### tfswitch version: " + process?.env?.TF_VERSION
    );
  }

  async check(
    foldersToRunCheck: string[],
    workDir: string
  ): Promise<AnalysisFile[]> {
    const res: AnalysisFile[] = [];
    const asyncIterable = async (iterable, action) => {
      for (const [index, value] of iterable?.entries()) {
        const output = await action({ runFolder: value, workDir });
        const file: AnalysisFile = {
          uuid: getUuidByString(value),
          folder: value,
          output,
        };
        res.push(file);
        console.log(
          `::group::##### IAC Connectivity Risk Analysis ##### ${
            iterable?.entries()?.length > 1 ? "." + index + 1 : ""
          } - ${this.type} Result for folder ${file.folder}:\n ${JSON.stringify(
            file
          )}\n::endgroup::`
        );
      }
    };
    try {
      await asyncIterable(foldersToRunCheck, this.terraform);
    } catch (error) {
      console.log("Framework check failed " + error);
    }
    console.log(`::group::Files To Analyze\n ${JSON.stringify(res, null, "\t")}\n::endgroup::`);
    return res;
  }
}
