import { ExecOutput } from "../vcs/vcs.model";

export enum RiskSeverity {
  "critical" = 0,
  "high" = 1,
  "medium" = 2,
  "low" = 3,
}

export const severityOrder = RiskSeverity;

export interface RiskAnalysisResult {
  proceeded_file: string;
  success: boolean;
  additions: AnalysisResultAdditions;
  error?: string;
  folder?: string;
}

export interface AnalysisResultAdditions {
  analysis_state: boolean;
  analysis_result: Risk[];
}

export interface Risk {
  riskTitle: string;
  riskSeverity: keyof RiskSeverity;
  riskDescription: string;
  riskRecommendation: string;
  riskId: string;
  items: RiskItem[];
}

export interface RiskItem {
  toPort: number;
  fromPort: number;
  ipProtocol: string;
  ipRange: number[];
  vendor?: string
}


export interface RiskAnalysisFile {
  uuid: string;
  output: {plan: string, log: ExecOutput, initLog: ExecOutput};
  folder: string;
}