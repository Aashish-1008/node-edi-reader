'use strict';
var X12SerializationOptions_1 = require('./X12SerializationOptions');
var X12FunctionalGroup = (function () {
    function X12FunctionalGroup() {
        this.transactions = new Array();
    }
    X12FunctionalGroup.prototype.toString = function (options) {
        options = X12SerializationOptions_1.defaultSerializationOptions(options);
        var edi = this.header.toString(options);
        if (options.format) {
            edi += options.endOfLine;
        }
        for (var i = 0; i < this.transactions.length; i++) {
            edi += this.transactions[i].toString(options);
            if (options.format) {
                edi += options.endOfLine;
            }
        }
        edi += this.trailer.toString(options);
        return edi;
    };
    return X12FunctionalGroup;
}());
exports.X12FunctionalGroup = X12FunctionalGroup;
