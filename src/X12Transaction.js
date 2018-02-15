'use strict';
var X12SerializationOptions_1 = require('./X12SerializationOptions');
var X12Transaction = (function () {
    function X12Transaction() {
        this.segments = new Array();
    }
    X12Transaction.prototype.toString = function (options) {
        options = X12SerializationOptions_1.defaultSerializationOptions(options);
        var edi = this.header.toString(options);
        if (options.format) {
            edi += options.endOfLine;
        }
        for (var i = 0; i < this.segments.length; i++) {
            edi += this.segments[i].toString(options);
            if (options.format) {
                edi += options.endOfLine;
            }
        }
        edi += this.trailer.toString(options);
        return edi;
    };
    return X12Transaction;
}());
exports.X12Transaction = X12Transaction;
