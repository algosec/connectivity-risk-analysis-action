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
const code_analysis_1 = require("./code-analysis");
const framework_service_1 = require("./iaas-tools/framework.service");
const vcs_service_1 = require("./vcs/vcs.service");
// import {
//     codeAnalysisResponses,
//     filesToAnalyze
// } from "../test/mockData.folder-error"
class Main {
    constructor() {
        this.vcsType = "github"; // Add when supported (process?.env?.VCS ?? 'github') as VersionControlKeys;
        this.frameworkType = "terraform"; // Add when supported (process?.env?.FRAMEWORK ?? 'terraform') as FrameworkKeys;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vcs = yield new vcs_service_1.VersionControlService().getInstanceByType(this.vcsType);
                const framework = yield new framework_service_1.FrameworkService().getInstanceByType(this.frameworkType, vcs);
                const codeAnalyzer = yield new code_analysis_1.AshCodeAnalysis(vcs);
                const isInitilizaed = yield codeAnalyzer.init();
                if (isInitilizaed && framework) {
                    let foldersToRunCheck = [];
                    foldersToRunCheck = yield vcs.checkForDiffByFileTypes(framework.fileTypes);
                    if ((foldersToRunCheck === null || foldersToRunCheck === void 0 ? void 0 : foldersToRunCheck.length) > 0) {
                        const filesToAnalyze = yield (framework === null || framework === void 0 ? void 0 : framework.check(foldersToRunCheck, vcs.workDir));
                        if ((filesToAnalyze === null || filesToAnalyze === void 0 ? void 0 : filesToAnalyze.length) > 0) {
                            const codeAnalysisResponses = yield codeAnalyzer.analyze(filesToAnalyze);
                            yield vcs.parseOutput(filesToAnalyze, codeAnalysisResponses);
                        }
                        else {
                            yield vcs.parseOutput([], [], "No files to analyze");
                        }
                    }
                }
                else {
                    yield vcs.parseOutput([], [], "Not Authenticated, please check action's logs");
                }
            }
            catch (_e) {
                throw new Error(_e);
            }
        });
    }
}
exports.Main = Main;
