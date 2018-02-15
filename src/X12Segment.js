'use strict';
var Positioning_1 = require('./Positioning');
var X12SerializationOptions_1 = require('./X12SerializationOptions');
var X12Segment = (function () {
    function X12Segment() {
        this.tag = '';
        this.elements = new Array();
        this.loopId = '';
        this.lineNumber = 0;
        this.range = new Positioning_1.Range();
    }
    X12Segment.prototype.toString = function (options) {
        options = X12SerializationOptions_1.defaultSerializationOptions(options);
        var edi = this.tag;
        for (var i = 0; i < this.elements.length; i++) {
            edi += options.elementDelimiter;
            edi += this.elements[i].value;
        }
        edi += options.segmentTerminator;
        return edi;
    };
    X12Segment.prototype.valueOf = function (segmentPosition, defaultValue) {
        var index = segmentPosition - 1;
        if (this.elements.length <= index) {
            return defaultValue || null;
        }
        return this.elements[index].value || defaultValue || null;
    };
    return X12Segment;
}());
exports.X12Segment = X12Segment;
