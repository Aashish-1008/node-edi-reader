'use strict';
var X12Diagnostic = (function () {
    function X12Diagnostic(level, message, range) {
        this.level = level || X12DiagnosticLevel.Error;
        this.message = message || '';
        this.range = range;
    }
    return X12Diagnostic;
}());
exports.X12Diagnostic = X12Diagnostic;
(function (X12DiagnosticLevel) {
    X12DiagnosticLevel[X12DiagnosticLevel["Info"] = 0] = "Info";
    X12DiagnosticLevel[X12DiagnosticLevel["Warning"] = 1] = "Warning";
    X12DiagnosticLevel[X12DiagnosticLevel["Error"] = 2] = "Error";
})(exports.X12DiagnosticLevel || (exports.X12DiagnosticLevel = {}));
var X12DiagnosticLevel = exports.X12DiagnosticLevel;
