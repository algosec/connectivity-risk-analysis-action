"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Terraform = void 0;
const exec_1 = require("../common/exec");
const fs_1 = require("fs");
const uuid_by_string_1 = __importDefault(require("uuid-by-string"));
class Terraform {
    constructor(vcs) {
        this.vcs = vcs;
        this.fileTypes = [".tf"];
        this.type = "terraform";
        this.steps = {};
        this.steps = {};
    }
    terraform(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = { plan: {}, log: { stderr: '', stdout: '', exitCode: 0 }, initLog: { stderr: '', stdout: '', exitCode: 0 } };
            const steps = {};
            const initLog = { stdout: '', stderr: '', exitCode: 0 };
            try {
                process.chdir(`${options.workDir}/${options.runFolder}`);
                steps.init = yield (0, exec_1.exec)("terraform", ["init"]);
                steps.fmt = yield (0, exec_1.exec)("terraform", ["fmt", "-diff"]);
                steps.validate = yield (0, exec_1.exec)("terraform", ["validate", "-no-color"]);
                if (!(0, fs_1.existsSync)("./tmp")) {
                    yield (0, exec_1.exec)("mkdir", ["tmp"]);
                }
                steps.plan = yield (0, exec_1.exec)("terraform", [
                    "plan",
                    "-input=false",
                    "-no-color",
                    `-out=${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf-${options.runFolder}.out`,
                ]);
                const initLog = {
                    exitCode: 0,
                    stdout: steps.init.stdout.concat(steps.fmt.stdout, steps.validate.stdout, steps.plan.stdout),
                    stderr: steps.init.stderr.concat(steps.fmt.stderr, steps.validate.stderr, steps.plan.stderr),
                };
                let jsonPlan = {};
                if (steps.plan.stdout) {
                    jsonPlan = JSON.parse((yield (0, exec_1.exec)("terraform", [
                        "show",
                        "-json",
                        `${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf-${options.runFolder}.out`,
                    ])).stdout);
                }
                process.chdir(options.workDir);
                result = { plan: jsonPlan, log: steps.plan, initLog };
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log(error === null || error === void 0 ? void 0 : error.message); // setFailed(error?.message)
                    result = { plan: {}, log: { stderr: error === null || error === void 0 ? void 0 : error.message, stdout: '', exitCode: 0 }, initLog };
                }
            }
            console.log(`::endgroup::`);
            return result;
        });
    }
    setVersion(steps) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            steps.setupVersion = yield (0, exec_1.exec)("curl", [
                "-L",
                "https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh",
                "|",
                "bash",
            ]);
            console.log("##### IAC Connectivity Risk Analysis ##### tfswitch Installed successfully");
            if (((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.TF_VERSION) == "latest" ||
                ((_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.TF_VERSION) == "") {
                steps.switchVersion = yield (0, exec_1.exec)("tfswitch", ["--latest"]);
            }
            else {
                steps.switchVersion = yield (0, exec_1.exec)("tfswitch", []);
            }
            console.log("##### IAC Connectivity Risk Analysis ##### tfswitch version: " + ((_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.TF_VERSION));
        });
    }
    check(foldersToRunCheck, workDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = [];
            const asyncIterable = (iterable, action) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                for (const [index, value] of iterable === null || iterable === void 0 ? void 0 : iterable.entries()) {
                    const output = yield action({ runFolder: value, workDir });
                    const file = {
                        uuid: (0, uuid_by_string_1.default)(value),
                        folder: value,
                        output,
                    };
                    res.push(file);
                    console.log(`::group::##### IAC Connectivity Risk Analysis #####\n ${((_a = iterable === null || iterable === void 0 ? void 0 : iterable.entries()) === null || _a === void 0 ? void 0 : _a.length) > 1 ? "." + index + 1 : ""} - ${this.type} Result for folder ${file.folder}: ${JSON.stringify(file)}\n::endgroup::`);
                }
            });
            try {
                yield asyncIterable(foldersToRunCheck, this.terraform);
            }
            catch (error) {
                console.log("Framework check failed " + error);
            }
            console.log(`::group::Files To Analyze\n ${JSON.stringify(res)}\n::endgroup::`);
            return res;
        });
    }
}
exports.Terraform = Terraform;
