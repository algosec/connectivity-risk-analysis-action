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
exports.loginToAws = void 0;
const aws_sdk_1 = require("aws-sdk");
function loginToAws() {
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
exports.loginToAws = loginToAws;
