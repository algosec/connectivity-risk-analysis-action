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
exports.AwsProvider = void 0;
const aws_sdk_1 = require("aws-sdk");
const core_1 = require("@actions/core");
const s3Client_1 = require("./s3Client");
const github_1 = require("@actions/github");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const http_client_1 = require("@actions/http-client");
class AwsProvider {
    constructor(actionUuid, s3Dest) {
        this.s3Dest = s3Dest;
        this.actionUuid = actionUuid;
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
    uploadToS3(keyName, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const http = new http_client_1.HttpClient();
            // Set the parameters.
            const bucketParams = {
                Bucket: this.s3Dest,
                ACL: 'bucket-owner-full-control',
                Body: body,
                Key: `github-codeanalysis/tmp${keyName}.out`,
                Metadata: { customer: github_1.context.repo.owner, action_id: this.actionUuid }
            };
            const command = new client_s3_1.PutObjectCommand(bucketParams);
            // Create the presigned URL.
            const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client_1.s3Client, command, {
                expiresIn: 3600,
            });
            const response = yield http.put(signedUrl, JSON.stringify(bucketParams.Body));
            if (response.message.statusCode == 200) {
                return response;
            }
            else {
                (0, core_1.setFailed)(response.message.statusMessage);
            }
            // debug(`got the following bucket name ${bucketName}`);
            // const s3 = new AWS.S3();
            // const objectParams: AWS.S3.Types.PutObjectRequest = {
            //   Bucket: this.s3Dest,
            //   ACL: 'bucket-owner-full-control',
            //   Body: body,
            //   Key: 'tmp' + keyName + '.out',
            //   Metadata: {customer: context.repo.owner, action_id: actionUuid}
            // };
            // return s3.putObject(objectParams).promise();
        });
    }
}
exports.AwsProvider = AwsProvider;
