import {  RiskAnalysisFile } from "../common/risk.model";
import {
  FrameworkKeys,
  FrameworkOptions,
  FrameworkResult,
  IFramework,
} from "./framework.model";
import { existsSync } from "fs";
import * as uuid from "uuid";
import { IVersionControl, VersionControlClassType, VersionControlKeys } from "../vcs/vcs.model";
import { ExecOutput } from "../vcs/vcs.model";

export class Terraform implements IFramework {
  fileTypes = [".tf"];
  type: FrameworkKeys = "terraform";
  constructor(public vcs: IVersionControl) {
  }

  async terraform(options: FrameworkOptions, vcs: VersionControlClassType<VersionControlKeys>): Promise<FrameworkResult> {
    let result: FrameworkResult = {plan: "", log: {stderr: '', stdout: '', exitCode: 0}, initLog: {stderr: '', stdout: '', exitCode: 0}}
    const initLog: ExecOutput = {stdout: '', stderr: '', exitCode: 0};
    try {
      process.chdir(`${options.path}`);
      vcs.logger.info(`Run Terraform on folder ${options.runFolder}`, true, false)
      vcs.steps.init = await vcs.exec("terraform", ["init"]);
      vcs.steps.fmt = await vcs.exec("terraform", ["fmt", "-diff"]);
      vcs.steps.validate = await vcs.exec("terraform", ["validate", "-no-color"]);
      if (!existsSync("./tmp")) {
        await vcs.exec("mkdir", ["tmp"]);
      }
      vcs.steps.plan = await vcs.exec("terraform", [
        "plan",
        "-input=false",
        "-no-color",
        `-out=${process?.cwd()}\\tmp\\${options.runFolder}.out`,
      ]);
      const initLog = {
        exitCode: 0,
        stdout: vcs.steps.init.stdout.concat(
          vcs.steps.fmt.stdout,
          vcs.steps.validate.stdout,
          vcs.steps.plan.stdout
        ),
        stderr: vcs.steps.init.stderr.concat(
          vcs.steps.fmt.stderr,
          vcs.steps.validate.stderr,
          vcs.steps.plan.stderr
        ),
      };
      let jsonPlan = '';
      if (vcs.steps.plan.stdout != '') {
        jsonPlan = 
          (
            await vcs.exec("terraform", [
              "show",
              "-json",
              `${process.cwd()}\\tmp\\${options.runFolder}.out`,
            ])
          ).stdout
      }
      process.chdir(options.workDir);
      result = { plan: jsonPlan, log: vcs.steps.plan, initLog };
    } catch (error: any) {
      if (error instanceof Error) {
        vcs.logger.info(error?.message); // setFailed(error?.message)
        result = { plan: '', log: { stderr: error?.message, stdout: '', exitCode:0  },  initLog };
      }
    }
    console.log('::endgroup::')
    return result
  }

  async setVersion(): Promise<void> {
    this.vcs.steps.setupVersion = await this.vcs.exec("curl", [
      "-L",
      "https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh",
      "|",
      "bash",
    ]);
    this.vcs.logger.info("tfswitch Installed successfully");
    if (
      process?.env?.TF_VERSION == "latest" ||
      process?.env?.TF_VERSION == ""
    ) {
      this.vcs.steps.switchVersion = await this.vcs.exec("tfswitch", ["--latest"]);
    } else {
      this.vcs.steps.switchVersion = await this.vcs.exec("tfswitch", []);
    }
    this.vcs.logger.info(
      "tfswitch version: " + process?.env?.TF_VERSION
    );
  }

  async check(
    foldersToRunCheck: string[],
    workDir: string
  ): Promise<RiskAnalysisFile[]> {
    const res: RiskAnalysisFile[] = [];
    const asyncIterable = async (iterable, action) => {
      for (const [index, value] of iterable?.entries()) {
        const output = await action({ runFolder: value?.split(/([/\\])/g)?.pop(), workDir, path: value }, this.vcs);
        const file: RiskAnalysisFile = {
          uuid: uuid.v4(),
          folder: value?.split(/([/\\])/g)?.pop(),
          output,
        };
        this.vcs.logger.debug(`Folder ${file.folder} Action UUID: ${file.uuid}`);
        res.push(file);
      }
    };
    try {
      await asyncIterable(foldersToRunCheck, this.terraform);
    } catch (error) {
      this.vcs.logger.info("Framework check failed: " + error);
    }
    this.vcs.logger.info(`Finished Terraform check`);
    return res;
  }
}
