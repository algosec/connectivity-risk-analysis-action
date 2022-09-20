"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Terraform = void 0;
const fs_1 = require("fs");
const uuid = __importStar(require("uuid"));
class Terraform {
    constructor(vcs) {
        this.vcs = vcs;
        this.fileTypes = [".tf"];
        this.type = "terraform";
    }
    terraform(options, vcs) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = { plan: "", log: { stderr: '', stdout: '', exitCode: 0 }, initLog: { stderr: '', stdout: '', exitCode: 0 } };
            const initLog = { stdout: '', stderr: '', exitCode: 0 };
            try {
                process.chdir(`${options.path}`);
                vcs.logger.info(`Run Terraform on folder ${options.runFolder}`, true, false);
                vcs.steps.init = yield vcs.exec("terraform", ["init"]);
                vcs.steps.fmt = yield vcs.exec("terraform", ["fmt", "-diff"]);
                vcs.steps.validate = yield vcs.exec("terraform", ["validate", "-no-color"]);
                if (!(0, fs_1.existsSync)("./tmp")) {
                    yield vcs.exec("mkdir", ["tmp"]);
                }
                vcs.steps.plan = yield vcs.exec("terraform", [
                    "plan",
                    "-input=false",
                    "-no-color",
                    `-out=${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\${options.runFolder}.out`,
                ]);
                const initLog = {
                    exitCode: 0,
                    stdout: vcs.steps.init.stdout.concat(vcs.steps.fmt.stdout, vcs.steps.validate.stdout, vcs.steps.plan.stdout),
                    stderr: vcs.steps.init.stderr.concat(vcs.steps.fmt.stderr, vcs.steps.validate.stderr, vcs.steps.plan.stderr),
                };
                let jsonPlan = '';
                if (vcs.steps.plan.stdout != '') {
                    jsonPlan =
                        (yield vcs.exec("terraform", [
                            "show",
                            "-json",
                            `${process.cwd()}\\tmp\\${options.runFolder}.out`,
                        ])).stdout;
                }
                process.chdir(options.workDir);
                result = { plan: jsonPlan, log: vcs.steps.plan, initLog };
            }
            catch (error) {
                if (error instanceof Error) {
                    vcs.logger.info(error === null || error === void 0 ? void 0 : error.message); // setFailed(error?.message)
                    result = { plan: '', log: { stderr: error === null || error === void 0 ? void 0 : error.message, stdout: '', exitCode: 0 }, initLog };
                }
            }
            console.log('::endgroup::');
            return result;
        });
    }
    setVersion() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            this.vcs.steps.setupVersion = yield this.vcs.exec("curl", [
                "-L",
                "https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh",
                "|",
                "bash",
            ]);
            this.vcs.logger.info("tfswitch Installed successfully");
            if (((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.TF_VERSION) == "latest" ||
                ((_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.TF_VERSION) == "") {
                this.vcs.steps.switchVersion = yield this.vcs.exec("tfswitch", ["--latest"]);
            }
            else {
                this.vcs.steps.switchVersion = yield this.vcs.exec("tfswitch", []);
            }
            this.vcs.logger.info("tfswitch version: " + ((_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.TF_VERSION));
        });
    }
    check(foldersToRunCheck, workDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = [];
            const asyncIterable = (iterable, action) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                for (const [index, value] of iterable === null || iterable === void 0 ? void 0 : iterable.entries()) {
                    const output = yield action({ runFolder: (_a = value === null || value === void 0 ? void 0 : value.split(/([/\\])/g)) === null || _a === void 0 ? void 0 : _a.pop(), workDir, path: value }, this.vcs);
                    const file = {
                        uuid: uuid.v4(),
                        folder: (_b = value === null || value === void 0 ? void 0 : value.split(/([/\\])/g)) === null || _b === void 0 ? void 0 : _b.pop(),
                        output,
                    };
                    this.vcs.logger.info(`Folder ${file.folder} Action UUID: ${file.uuid}`);
                    res.push(file);
                }
            });
            try {
                yield asyncIterable(foldersToRunCheck, this.terraform);
            }
            catch (error) {
                this.vcs.logger.info("Framework check failed: " + error);
            }
            this.vcs.logger.info(`Finished Terraform check`);
            return res;
        });
    }
}
exports.Terraform = Terraform;
