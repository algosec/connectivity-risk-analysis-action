"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.severityOrder = exports.RiskSeverity = void 0;
var RiskSeverity;
(function (RiskSeverity) {
    RiskSeverity[RiskSeverity["critical"] = 0] = "critical";
    RiskSeverity[RiskSeverity["high"] = 1] = "high";
    RiskSeverity[RiskSeverity["medium"] = 2] = "medium";
    RiskSeverity[RiskSeverity["low"] = 3] = "low";
})(RiskSeverity = exports.RiskSeverity || (exports.RiskSeverity = {}));
exports.severityOrder = RiskSeverity;
