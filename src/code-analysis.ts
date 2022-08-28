import "dotenv/config";
import { IVersionControl } from "./vcs/vcs.model";
import { ExecSteps, AnalysisFile } from "./common/exec";
import { AnalysisResult } from "./common/risk.model";

export class AshCodeAnalysis {
  steps: ExecSteps = {};
  debugMode;
  apiUrl;
  tenantId;
  clientId;
  clientSecret;
  loginAPI;
  actionUuid;
  jwt: string;

  constructor(public vcs: IVersionControl) {}

  async init(): Promise<void> {
    this.setSecrets();
    this.jwt = await this.auth(
      this.tenantId,
      this.clientId,
      this.clientSecret,
      this.loginAPI
    );
    if (!this.jwt || this.jwt == "") {
      this.vcs.logger.exit(
        "##### IAC Connectivity Risk Analysis ##### Not Authenticated"
      );
      return;
    }
    this.steps.auth = { exitCode: 0, stdout: this.jwt, stderr: "" };
  }

  setSecrets(): void {
    const inputs = this.vcs.getInputs();
    this.debugMode = inputs?.ALGOSEC_DEBUG == "true";
    this.apiUrl = inputs?.CF_API_URL;
    this.loginAPI = inputs?.CF_LOGIN_API ?? "";
    this.tenantId = inputs?.CF_TENANT_ID;
    this.clientId = inputs?.CF_CLIENT_ID;
    this.clientSecret = inputs?.CF_CLIENT_SECRET;
  }

  async auth(
    tenantId: string,
    clientID: string,
    clientSecret: string,
    loginAPI: string
  ): Promise<string> {
    const payload = {
      tenantId,
      clientId: clientID,
      clientSecret,
    };

    const headers = {
      "Content-Type": "application/json",
    };
    try {
      const res = await this.vcs.http.post(
        loginAPI,
        JSON.stringify(payload),
        headers
      );

      const response_code = res.message.statusCode;
      const data = JSON.parse(await res.readBody());
      if (response_code >= 200 && response_code <= 300) {
        this.vcs.logger.info(
          "##### IAC Connectivity Risk Analysis ##### Passed authentication vs CF's login. new token has been generated."
        );
        return data?.access_token;
      } else {
        this.vcs.logger.exit(
          `##### IAC Connectivity Risk Analysis ##### Failed to generate token. Error code ${response_code}, msg: ${JSON.stringify(
            data
          )}`
        );
      }
    } catch (error: any) {
      this.vcs.logger.exit(
        `##### IAC Connectivity Risk Analysis ##### Failed to generate token. Error msg: ${error.toString()}`
      );
    }
    return "";
  }

  async triggerCodeAnalysis(filesToUpload: AnalysisFile[]): Promise<void> {
    const fileUploadPromises: Array<Promise<void>> = [];
    filesToUpload.forEach((file) =>
      fileUploadPromises.push(this.uploadFile(file))
    );
    const response = await Promise.all(fileUploadPromises);

    if (response) {
      this.vcs.logger.info(
        "##### IAC Connectivity Risk Analysis ##### File/s were uploaded successfully"
      );
    }
  }

  async uploadFile(file: AnalysisFile): Promise<any> {
    let res = false;
    try {
      if (file?.output) {
        const ans = await this.vcs.uploadAnalysisFile(file, this.jwt);
        if (ans) {
          res = true;
        }
      }
    } catch (e) {
      res = false;
    }
    return res;
  }

  async analyze(filesToUpload: AnalysisFile[]): Promise<AnalysisResult[]> {
    let analysisResult;
    await this.triggerCodeAnalysis(filesToUpload);
    const codeAnalysisPromises: Array<Promise<AnalysisResult | null>> = [];
    filesToUpload
      .filter((file) => file?.output?.plan)
      .forEach((file) =>
        codeAnalysisPromises.push(this.pollCodeAnalysisResponse(file))
      );
    console.log('::group::##### IAC Connectivity Risk Analysis ##### Analyzing Risks\n')
    analysisResult = await Promise.all(codeAnalysisPromises);
    console.log('::endgroup::')
    if (!analysisResult || analysisResult?.error) {
      this.vcs.logger.exit("##### IAC Connectivity Risk Analysis ##### Code Analysis failed");
      return []
    }
    this.vcs.logger.debug(
      `::group::##### IAC Connectivity Risk Analysis ##### Risk analysis result:\n${JSON.stringify(analysisResult)}\n::endgroup::`
    );
    return analysisResult;
  }

  async pollCodeAnalysisResponse(
    file: AnalysisFile
  ): Promise<AnalysisResult | null> {
    this.vcs.logger.info(
      `##### IAC Connectivity Risk Analysis ##### Waiting for risk analysis response for folder:${file.folder}\n`
    );
    let analysisResult = await this.checkCodeAnalysisResponse(file);
    for (let i = 0; i < 50; i++) {
      await this.wait(3000);
      analysisResult = await this.checkCodeAnalysisResponse(file);
      if (analysisResult?.additions) {
        analysisResult.folder = file?.folder;
        this.vcs.logger.debug(
          "##### IAC Connectivity Risk Analysis ##### Response: " + JSON.stringify(analysisResult)
        );
        break;
      } else if (analysisResult?.error) {
        this.vcs.logger.exit(
          "##### IAC Connectivity Risk Analysis ##### Poll Request failed: " + analysisResult?.error
        );
        break;
      }
    }
    return analysisResult;
  }

  async wait(ms = 1000): Promise<void> {
    return await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async checkCodeAnalysisResponse(
    file: AnalysisFile
  ): Promise<AnalysisResult | null> {
    const pollUrl = `${this.apiUrl}/message?customer=${this.vcs.repo.owner}&action_id=${file.uuid}`;
    const response = await this.vcs.http.get(pollUrl, {
      Authorization: "Bearer " + this.jwt,
    });
    if (response?.message?.statusCode == 200) {
      const body = await response.readBody();
      const message = body && body != "" ? JSON.parse(body) : null;
      if (message?.message_found) {
        const result = message?.result ? JSON.parse(message?.result) : null;
        return result;
      } else {
        return null;
      }
    } else {
      return {
        error: response.message.statusMessage,
        proceeded_file: "",
        additions: { analysis_result: [], analysis_state: false },
        success: false,
      };
    }
  }
}
