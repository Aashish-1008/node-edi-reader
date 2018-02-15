'use strict';
var X12SerializationOptions_1 = require('./X12SerializationOptions');
var X12Interchange = (function () {
    function X12Interchange(segmentTerminator, elementDelimiter) {
        this.functionalGroups = new Array();
        this.segmentTerminator = segmentTerminator;
        this.elementDelimiter = elementDelimiter;
    }
    X12Interchange.prototype.toString = function (options) {
        options = X12SerializationOptions_1.defaultSerializationOptions(options);
        var edi = this.header.toString(options);
        if (options.format) {
            edi += options.endOfLine;
        }
        for (var i = 0; i < this.functionalGroups.length; i++) {
            edi += this.functionalGroups[i].toString(options);
            if (options.format) {
                edi += options.endOfLine;
            }
        }
        edi += this.trailer.toString(options);
        return edi;
    };
    X12Interchange.prototype._padRight = function (input, width) {
        while (input.length < width) {
            input += ' ';
        }
        return input.substr(0, width);
    };
    return X12Interchange;
}());
exports.X12Interchange = X12Interchange;
