'use strict';
var ArgumentNullError = (function () {
    function ArgumentNullError(argumentName) {
        this.name = 'ArgumentNullError';
        this.message = "The argument, '" + argumentName + "', cannot be null.";
    }
    return ArgumentNullError;
}());
exports.ArgumentNullError = ArgumentNullError;
var ParserError = (function () {
    function ParserError(message) {
        this.name = 'ParserError';
        this.message = message;
    }
    return ParserError;
}());
exports.ParserError = ParserError;
var QuerySyntaxError = (function () {
    function QuerySyntaxError(message) {
        this.name = 'QuerySyntaxError';
        this.message = message;
    }
    return QuerySyntaxError;
}());
exports.QuerySyntaxError = QuerySyntaxError;
