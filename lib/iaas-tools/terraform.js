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
const core_1 = require("@actions/core");
const fs_1 = require("fs");
const uuid_by_string_1 = __importDefault(require("uuid-by-string"));
class Terraform {
    constructor() {
        this.fileTypes = ['.tf'];
        this.type = 'terraform';
        this.steps = {};
    }
    init(options) {
        return this;
    }
    terraform(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const steps = {};
            try {
                process.chdir(`${options.workDir}/${options.runFolder}`);
                // steps.setupVersion = await exec('curl', ['-L', 'https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh', '|', 'bash']);
                // info('##### Algosec ##### tfswitch Installed successfully')
                // if (process?.env?.TF_VERSION == "latest"  || process?.env?.TF_VERSION  == ""){
                //   steps.switchVersion = await exec('tfswitch', ['--latest']);
                // } else {
                //   steps.switchVersion = await exec('tfswitch', []);
                // }
                // info('##### Algosec ##### tfswitch version: ' + process?.env?.TF_VERSION)
                steps.init = yield (0, exec_1.exec)('terraform', ['init']);
                steps.fmt = yield (0, exec_1.exec)('terraform', ['fmt', '-diff']);
                steps.validate = yield (0, exec_1.exec)('terraform', ['validate', '-no-color']);
                if (!(0, fs_1.existsSync)('./tmp')) {
                    yield (0, exec_1.exec)('mkdir', ['tmp']);
                }
                steps.plan = yield (0, exec_1.exec)('terraform', ['plan', '-input=false', '-no-color', `-out=${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf-${options.runFolder}.out`]);
                const initLog = {
                    stdout: steps.init.stdout.concat(steps.fmt.stdout, steps.validate.stdout, steps.plan.stdout),
                    stderr: steps.init.stderr.concat(steps.fmt.stderr, steps.validate.stderr, steps.plan.stderr)
                };
                let jsonPlan = {};
                if (steps.plan.stdout) {
                    jsonPlan = JSON.parse((yield (0, exec_1.exec)('terraform', ['show', '-json', `${process === null || process === void 0 ? void 0 : process.cwd()}\\tmp\\tf-${options.runFolder}.out`])).stdout);
                }
                process.chdir(options.workDir);
                return { plan: jsonPlan, log: steps.plan, initLog };
            }
            catch (error) {
                if (error instanceof Error)
                    console.log(error === null || error === void 0 ? void 0 : error.message); //setFailed(error.message)
            }
        });
    }
    check(foldersToRunCheck, workDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = [];
            const asyncIterable = (iterable, action) => __awaiter(this, void 0, void 0, function* () {
                for (const [index, value] of iterable === null || iterable === void 0 ? void 0 : iterable.entries()) {
                    const output = yield action({ runFolder: value, workDir });
                    res.push({ uuid: (0, uuid_by_string_1.default)(value), folder: value, output });
                    (0, core_1.info)(`##### Algosec ##### Step 2.${index}- ${this.type} Result for folder ${value}: ${JSON.stringify(this)}`);
                }
            });
            try {
                yield asyncIterable(foldersToRunCheck, this.terraform);
            }
            catch (error) {
                (0, core_1.info)('Framework check failed ' + error);
            }
            return res;
        });
    }
}
exports.Terraform = Terraform;
