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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Main = void 0;
const child_process_1 = require("child_process");
const code_analysis_1 = require("./code-analysis");
const framework_service_1 = require("./iaas-tools/framework.service");
const vcs_service_1 = require("./vcs/vcs.service");
// import {
//     codeAnalysisResponses,
//     filesToAnalyze
// } from "../test/mockData.gcp"
class Main {
    constructor() {
        var _a, _b, _c, _d;
        this.steps = {};
        this.vcsType = ((_b = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.VCS) !== null && _b !== void 0 ? _b : 'github');
        this.frameworkType = ((_d = (_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.FRAMEWORK) !== null && _d !== void 0 ? _d : 'terraform');
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vcs = new vcs_service_1.VersionControlService().getInstanceByType(this.vcsType);
                const framework = new framework_service_1.FrameworkService().getInstanceByType(this.frameworkType, vcs);
                const codeAnalyzer = new code_analysis_1.AshCodeAnalysis(vcs);
                const isInitilizaed = yield codeAnalyzer.init();
                if (codeAnalyzer.debugMode) {
                    yield (0, child_process_1.exec)(`rimraf ${vcs.workDir}`);
                }
                let foldersToRunCheck = [];
                if (isInitilizaed) {
                    foldersToRunCheck = yield vcs.checkForDiffByFileTypes(framework.fileTypes);
                }
                if ((foldersToRunCheck === null || foldersToRunCheck === void 0 ? void 0 : foldersToRunCheck.length) > 0) {
                    const filesToAnalyze = yield framework.check(foldersToRunCheck, vcs.workDir);
                    if ((filesToAnalyze === null || filesToAnalyze === void 0 ? void 0 : filesToAnalyze.length) > 0) {
                        const codeAnalysisResponses = yield codeAnalyzer.analyze(filesToAnalyze);
                        if ((codeAnalysisResponses === null || codeAnalysisResponses === void 0 ? void 0 : codeAnalysisResponses.length) > 0) {
                            yield vcs.parseOutput(filesToAnalyze, codeAnalysisResponses);
                        }
                    }
                    else {
                        vcs.logger.exit('- ##### IAC Connectivity Risk Analysis ##### NO FILES TO ANALYZE');
                    }
                }
            }
            catch (_e) {
                console.log(_e);
            }
        });
    }
}
exports.Main = Main;
