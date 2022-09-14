import { exec, ExecSteps, AnalysisFile } from "../common/exec";
import {
  FrameworkKeys,
  FrameworkOptions,
  FrameworkResult,
  IFramework,
} from "./framework.model";
import { existsSync } from "fs";
import * as uuid from "uuid";
import { IVersionControl } from "../vcs/vcs.model";
import { ExecOutput } from "@actions/exec";

export class Terraform implements IFramework {
  fileTypes = [".tf"];
  type: FrameworkKeys = "terraform";
  constructor(public vcs: IVersionControl) {
  }

  async terraform(options: FrameworkOptions): Promise<FrameworkResult> {
    let result: FrameworkResult = {plan: "", log: {stderr: '', stdout: '', exitCode: 0}, initLog: {stderr: '', stdout: '', exitCode: 0}}
    const initLog: ExecOutput = {stdout: '', stderr: '', exitCode: 0};
    try {
      process.chdir(`${options.path}`);
      this.vcs.logger.info(`::group::##### IAC Connectivity Risk Analysis ##### Run Terraform on folder ${options.runFolder}`)
      this.vcs.steps.init = await exec("terraform", ["init"]);
      this.vcs.steps.fmt = await exec("terraform", ["fmt", "-diff"]);
      this.vcs.steps.validate = await exec("terraform", ["validate", "-no-color"]);
      if (!existsSync("./tmp")) {
        await exec("mkdir", ["tmp"]);
      }
      this.vcs.steps.plan = await exec("terraform", [
        "plan",
        "-input=false",
        "-no-color",
        `-out=${process?.cwd()}\\tmp\\${options.runFolder}.out`,
      ]);
      const initLog = {
        exitCode: 0,
        stdout: this.vcs.steps.init.stdout.concat(
          this.vcs.steps.fmt.stdout,
          this.vcs.steps.validate.stdout,
          this.vcs.steps.plan.stdout
        ),
        stderr: this.vcs.steps.init.stderr.concat(
          this.vcs.steps.fmt.stderr,
          this.vcs.steps.validate.stderr,
          this.vcs.steps.plan.stderr
        ),
      };
      let jsonPlan = '';
      if (this.vcs.steps.plan.stdout != '') {
        jsonPlan = 
          (
            await exec("terraform", [
              "show",
              "-json",
              `${process.cwd()}\\tmp\\${options.runFolder}.out`,
            ])
          ).stdout
      }
      this.vcs.logger.info(`::endgroup::`)
      process.chdir(options.workDir);
      result = { plan: jsonPlan, log: this.vcs.steps.plan, initLog };
    } catch (error: any) {
      if (error instanceof Error) {
        this.vcs.logger.info(error?.message); // setFailed(error?.message)
        result = { plan: '', log: { stderr: error?.message, stdout: '', exitCode:0  },  initLog };
      }
    }
    return result
  }

  async setVersion(steps: ExecSteps): Promise<void> {
    this.vcs.steps.setupVersion = await exec("curl", [
      "-L",
      "https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh",
      "|",
      "bash",
    ]);
    this.vcs.logger.info("- ##### IAC Connectivity Risk Analysis ##### tfswitch Installed successfully");
    if (
      process?.env?.TF_VERSION == "latest" ||
      process?.env?.TF_VERSION == ""
    ) {
      this.vcs.steps.switchVersion = await exec("tfswitch", ["--latest"]);
    } else {
      this.vcs.steps.switchVersion = await exec("tfswitch", []);
    }
    this.vcs.logger.info(
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
        const output = await action({ runFolder: value?.split(/([/\\])/g)?.pop(), workDir, path: value });
        const file: AnalysisFile = {
          uuid: uuid.v4(),
          folder: value?.split(/([/\\])/g)?.pop(),
          output,
        };
        this.vcs.logger.info(`- ##### IAC Connectivity Risk Analysis ##### Folder ${file.folder} Action UUID: ${file.uuid}`);
        res.push(file);
      }
    };
    try {
      await asyncIterable(foldersToRunCheck, this.terraform);
    } catch (error) {
      this.vcs.logger.info("- ##### IAC Connectivity Risk Analysis ##### Framework check failed: " + error);
    }
    this.vcs.logger.info(`- ##### IAC Connectivity Risk Analysis ##### Finished Terraform check`);
    // this.vcs.logger.info(`::group::##### IAC Connectivity Risk Analysis ##### Files To Analyze\n ${JSON.stringify(res, null, "\t")}\n::endgroup::`);
    return res;
  }
}
