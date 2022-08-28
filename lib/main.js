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
        var _a, _b;
        this.steps = {};
        this.vcsType = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.VCS_TYPE;
        this.frameworkType = (_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.FRAMEWORK_TYPE;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vcs = new vcs_service_1.VersionControlService().getInstanceByType(this.vcsType);
                const framework = new framework_service_1.FrameworkService().getInstanceByType(this.frameworkType, vcs);
                const codeAnalyzer = new code_analysis_1.AshCodeAnalysis(vcs);
                yield codeAnalyzer.init();
                if (codeAnalyzer.debugMode) {
                    yield (0, child_process_1.exec)(`rimraf ${vcs.workDir}`);
                }
                const foldersToRunCheck = yield vcs.checkForDiffByFileTypes(framework.fileTypes);
                if (foldersToRunCheck) {
                    console.log(`CHECK FOLDERS: ${foldersToRunCheck.join(',')} WORKDIR:  ${vcs.workDir}`);
                    const filesToAnalyze = yield framework.check(foldersToRunCheck, vcs.workDir);
                    if (filesToAnalyze) {
                        const codeAnalysisResponses = yield codeAnalyzer.analyze(filesToAnalyze);
                        if ((codeAnalysisResponses === null || codeAnalysisResponses === void 0 ? void 0 : codeAnalysisResponses.length) > 0) {
                            yield vcs.parseOutput(filesToAnalyze, codeAnalysisResponses);
                        }
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
