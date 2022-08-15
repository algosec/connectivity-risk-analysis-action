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
exports.Aws = void 0;
const aws_sdk_1 = require("aws-sdk");
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const http_client_1 = require("@actions/http-client");
class Aws {
    constructor(s3Dest) {
        this.s3Dest = s3Dest;
    }
    init() {
        return 'Aws';
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            aws_sdk_1.config.getCredentials(function (err) {
                if (err)
                    console.log(err.stack);
                // credentials not loaded
                else {
                    console.log("aws region:", aws_sdk_1.config.region);
                }
            });
        });
    }
    uploadToS3(actionUuid, body, jwt) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const http = new http_client_1.HttpClient();
            const getPresignedUrl = `${(_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.SI_API_URL}?jwt=${jwt}&actionId=${actionUuid}&owner=${github_1.context.repo.owner}`;
            const presignedUrlResponse = yield (yield http.get(getPresignedUrl)).readBody();
            const presignedUrl = JSON.parse(presignedUrlResponse).presignedUrl;
            const response = yield (yield http.put(presignedUrl, body, { 'Content-Type': 'application/json' })).readBody();
            if (response == '') {
                return true;
            }
            else {
                (0, core_1.setFailed)(response);
            }
        });
    }
}
exports.Aws = Aws;
