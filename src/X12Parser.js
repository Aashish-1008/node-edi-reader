'use strict';
var Errors_1 = require('./Errors');
var Positioning_1 = require('./Positioning');
var X12Diagnostic_1 = require('./X12Diagnostic');
var X12Interchange_1 = require('./X12Interchange');
var X12FunctionalGroup_1 = require('./X12FunctionalGroup');
var X12Transaction_1 = require('./X12Transaction');
var X12Segment_1 = require('./X12Segment');
var X12Element_1 = require('./X12Element');
var DOCUMENT_MIN_LENGTH = 113;
var SEGMENT_TERMINATOR_POS = 105;
var ELEMENT_DELIMITER_POS = 3;
var INTERCHANGE_CACHE_SIZE = 10;
var loop = require('../config/loop');
var X12Parser = (function() {
    function X12Parser(_strict) {
        this._strict = _strict;
        this.diagnostics = new Array();
    }


    function getRegEx(pattern, regex) {
        var flags, term, grabLineRegEx

        if (typeof pattern === 'object' && pattern.flags) {
            term = pattern.term
            flags = pattern.flags
        } else {
            term = pattern
            flags = 'g'
        }

        grabLineRegEx = "(.*" + term + ".*)"

        if (regex === 'line') {
            return new RegExp(grabLineRegEx, flags)
        }

        return new RegExp(term, flags);
    }

    X12Parser.prototype.parseX12 = function(edi, transactionTypeId) {
        var _this = this;
        if (!edi) {
            throw new Errors_1.ArgumentNullError('edi');
        }
        this.diagnostics.splice(0);
        if (edi.length < DOCUMENT_MIN_LENGTH) {
            var errorMessage = "X12 Standard: Document is too short. Document must be at least " + DOCUMENT_MIN_LENGTH + " characters long to be well-formed X12.";
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, new Positioning_1.Range(0, 0, 0, edi.length - 1)));
        }

        if (!transactionTypeId || !(transactionTypeId == "005010X222A1" || transactionTypeId == "005010X223A2")) {
            var errorMessage = "missing transactionTypeId field. Its value can be - 005010X222A1 , 005010X223A2";
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, new Positioning_1.Range(0, 0, 0, edi.length - 1)));
        }

        var segmentTerminator = edi.charAt(SEGMENT_TERMINATOR_POS);
        var elementDelimiter = edi.charAt(ELEMENT_DELIMITER_POS);
        if (edi.charAt(103) !== elementDelimiter) {
            var errorMessage = 'X12 Standard: The ISA segment is not the correct length (106 characters, including segment terminator).';
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, new Positioning_1.Range(0, 0, 0, 2)));
        }
        var interchange = new X12Interchange_1.X12Interchange(segmentTerminator, elementDelimiter);
        var group;
        var transaction;
        var segments = this._parseSegments(edi, segmentTerminator, elementDelimiter, transactionTypeId);
        segments.forEach(function(seg) {
            if (seg.tag == 'ISA') {
                _this._processISA(interchange, seg);
            } else if (seg.tag == 'IEA') {
                _this._processIEA(interchange, seg);
            } else if (seg.tag == 'GS') {
                group = new X12FunctionalGroup_1.X12FunctionalGroup();
                _this._processGS(group, seg);
                interchange.functionalGroups.push(group);
            } else if (seg.tag == 'GE') {
                if (!group) {
                    var errorMessage = 'X12 Standard: Missing GS segment!';
                    if (_this._strict) {
                        throw new Errors_1.ParserError(errorMessage);
                    }
                    _this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, seg.range));
                }
                _this._processGE(group, seg);
                group = null;
            } else if (seg.tag == 'ST') {
                if (!group) {
                    var errorMessage = "X12 Standard: " + seg.tag + " segment cannot appear outside of a functional group.";
                    if (_this._strict) {
                        throw new Errors_1.ParserError(errorMessage);
                    }
                    _this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, seg.range));
                }
                transaction = new X12Transaction_1.X12Transaction();
                _this._processST(transaction, seg);
                group.transactions.push(transaction);
            } else if (seg.tag == 'SE') {
                if (!group) {
                    var errorMessage = "X12 Standard: " + seg.tag + " segment cannot appear outside of a functional group.";
                    if (_this._strict) {
                        throw new Errors_1.ParserError(errorMessage);
                    }
                    _this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, seg.range));
                }
                if (!transaction) {
                    var errorMessage = 'X12 Standard: Missing ST segment!';
                    if (_this._strict) {
                        throw new Errors_1.ParserError(errorMessage);
                    }
                    _this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, seg.range));
                }
                _this._processSE(transaction, seg);
                transaction = null;
            } else {
                if (!group) {
                    var errorMessage = "X12 Standard: " + seg.tag + " segment cannot appear outside of a functional group.";
                    if (_this._strict) {
                        throw new Errors_1.ParserError(errorMessage);
                    }
                    _this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, seg.range));
                }
                if (!transaction) {
                    var errorMessage = "X12 Standard: " + seg.tag + " segment cannot appear outside of a transaction.";
                    if (_this._strict) {
                        throw new Errors_1.ParserError(errorMessage);
                    }
                    _this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, seg.range));
                } else {
                    transaction.segments.push(seg);
                }
            }
        });
        return interchange;
    };
    X12Parser.prototype._parseSegments = function(edi, segmentTerminator, elementDelimiter, transactionTypeId) {
        var segments = new Array();
        var tagged = false;
        var currentSegment;
        var currentElement;


        var loopData = loop.getLoopData(transactionTypeId);
        var currentLoopId;

        currentSegment = new X12Segment_1.X12Segment();

        for (var i = 0, l = 0, c = 0; i < edi.length; i++) {
            if (!tagged && (edi[i].search(/\s/) == -1) && (edi[i] !== elementDelimiter) && (edi[i] !== segmentTerminator)) {
                currentSegment.tag += edi[i];
                if (!currentSegment.range.start) {
                    currentSegment.range.start = new Positioning_1.Position(l, c);
                }
            } else if (!tagged && (edi[i].search(/\s/) > -1)) {
                if (edi[i] == '\n') {
                    l++;
                    c = -1;
                }
            } else if (!tagged && (edi[i] == elementDelimiter)) {
                tagged = true;
                currentElement = new X12Element_1.X12Element();
                currentElement.range.start = new Positioning_1.Position(l, c);
            } else if (edi[i] == segmentTerminator) {
                currentElement.range.end = new Positioning_1.Position(l, (c - 1));
                currentSegment.elements.push(currentElement);
                currentSegment.range.end = new Positioning_1.Position(l, c);


                // attach loopId to segment
                // var options = {
                //     elementDelimiter: elementDelimiter,
                //     segmentTerminator: segmentTerminator
                // }
                var currentSegmentLine = currentSegment.toString();

                for (var k = 0; k < loopData.length; k++) {

                    for (var p = 0; p < loopData[k].startPatterns.length; p++) {
                        if (currentSegmentLine.match(getRegEx(loopData[k].startPatterns[p], 'g')) && !loopData[k].isUsed) {
                            currentLoopId = loopData[k].loopId
                            console.log('matches', k, currentLoopId);
                            currentSegment.loopId = currentLoopId
                            loopData[k].isUsed = true;
                        }
                    }

                    currentSegment.loopId = currentLoopId
                }


                segments.push(currentSegment);
                currentSegment = new X12Segment_1.X12Segment();
                tagged = false;
                if (segmentTerminator === '\n') {
                    l++;
                    c = -1;
                }
            } else if (tagged && (edi[i] == elementDelimiter)) {
                currentElement.range.end = new Positioning_1.Position(l, (c - 1));
                currentSegment.elements.push(currentElement);
                currentElement = new X12Element_1.X12Element();
                currentElement.range.start = new Positioning_1.Position(l, c + 1);
            } else {
                currentElement.value += edi[i];
            }
            c++;
        }
        return segments;
    };

    // X12Parser.prototype._addLoop = function(segment, loopData) {
    //     interchange.header = segment;
    // };


    X12Parser.prototype._processISA = function(interchange, segment) {
        interchange.header = segment;
    };
    X12Parser.prototype._processIEA = function(interchange, segment) {
        interchange.trailer = segment;
        if (parseInt(segment.valueOf(1)) !== interchange.functionalGroups.length) {
            var errorMessage = "X12 Standard: The value in IEA01 (" + segment.valueOf(1) + ") does not match the number of GS segments in the interchange (" + interchange.functionalGroups.length + ").";
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, segment.elements[0].range));
        }
        if (segment.valueOf(2) !== interchange.header.valueOf(13)) {
            var errorMessage = "X12 Standard: The value in IEA02 (" + segment.valueOf(2) + ") does not match the value in ISA13 (" + interchange.header.valueOf(13) + ").";
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, segment.elements[1].range));
        }
    };
    X12Parser.prototype._processGS = function(group, segment) {
        group.header = segment;
    };
    X12Parser.prototype._processGE = function(group, segment) {
        group.trailer = segment;
        if (parseInt(segment.valueOf(1)) !== group.transactions.length) {
            var errorMessage = "X12 Standard: The value in GE01 (" + segment.valueOf(1) + ") does not match the number of ST segments in the functional group (" + group.transactions.length + ").";
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, segment.elements[0].range));
        }
        if (segment.valueOf(2) !== group.header.valueOf(6)) {
            var errorMessage = "X12 Standard: The value in GE02 (" + segment.valueOf(2) + ") does not match the value in GS06 (" + group.header.valueOf(6) + ").";
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, segment.elements[1].range));
        }
    };
    X12Parser.prototype._processST = function(transaction, segment) {
        transaction.header = segment;
    };
    X12Parser.prototype._processSE = function(transaction, segment) {
        transaction.trailer = segment;
        var expectedNumberOfSegments = (transaction.segments.length + 2);
        if (parseInt(segment.valueOf(1)) !== expectedNumberOfSegments) {
            var errorMessage = "X12 Standard: The value in SE01 (" + segment.valueOf(1) + ") does not match the number of segments in the transaction (" + expectedNumberOfSegments + ").";
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, segment.elements[0].range));
        }
        if (segment.valueOf(2) !== transaction.header.valueOf(2)) {
            var errorMessage = "X12 Standard: The value in SE02 (" + segment.valueOf(2) + ") does not match the value in ST02 (" + transaction.header.valueOf(2) + ").";
            if (this._strict) {
                throw new Errors_1.ParserError(errorMessage);
            }
            this.diagnostics.push(new X12Diagnostic_1.X12Diagnostic(X12Diagnostic_1.X12DiagnosticLevel.Error, errorMessage, segment.elements[1].range));
        }
    };
    return X12Parser;
}());
exports.X12Parser = X12Parser;