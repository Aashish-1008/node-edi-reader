'use strict';
var Errors_1 = require('./Errors');
var X12QueryEngine = (function () {
    function X12QueryEngine(_parser) {
        this._parser = _parser;
    }
    X12QueryEngine.prototype.query = function (rawEdi, reference) {
        var interchange = this._parser.parseX12(rawEdi);
        var hlPathMatch = reference.match(/HL\+(\w\+?)+[\+-]/g);
        var segPathMatch = reference.match(/([A-Z0-9]{2,3}-)+/g);
        var elmRefMatch = reference.match(/[A-Z0-9]{2,3}[0-9]{2}[^\[]?/g);
        var qualMatch = reference.match(/:[A-Za-z]{2,3}[0-9]{2,}\[\"[^\[\]\"\"]+\"\]/g);
        var results = new Array();
        for (var i = 0; i < interchange.functionalGroups.length; i++) {
            var group = interchange.functionalGroups[i];
            for (var j = 0; j < group.transactions.length; j++) {
                var txn = group.transactions[j];
                var segments = txn.segments;
                if (hlPathMatch) {
                    segments = this._evaluateHLQueryPart(txn, hlPathMatch[0]);
                }
                if (segPathMatch) {
                    segments = this._evaluateSegmentPathQueryPart(segments, segPathMatch[0]);
                }
                if (!elmRefMatch) {
                    throw new Errors_1.QuerySyntaxError('Element reference queries must contain an element reference!');
                }
                var txnResults = this._evaluateElementReferenceQueryPart(interchange, group, txn, [].concat(segments, [interchange.header, group.header, txn.header, txn.trailer, group.trailer, interchange.trailer]), elmRefMatch[0], qualMatch);
                txnResults.forEach(function (res) {
                    results.push(res);
                });
            }
        }
        return results;
    };
    X12QueryEngine.prototype.querySingle = function (rawEdi, reference) {
        var results = this.query(rawEdi, reference);
        return (results.length == 0) ? null : results[0];
    };
    X12QueryEngine.prototype._evaluateHLQueryPart = function (transaction, hlPath) {
        var qualified = false;
        var pathParts = hlPath.replace('-', '').split('+').filter(function (value, index, array) { return (value !== 'HL' && value !== '' && value !== null); });
        var matches = new Array();
        var lastParentIndex = -1;
        for (var i = 0, j = 0; i < transaction.segments.length; i++) {
            var segment = transaction.segments[i];
            if (qualified && segment.tag === 'HL') {
                var parentIndex = parseInt(segment.valueOf(2, '-1'));
                if (parentIndex !== lastParentIndex) {
                    j = 0;
                    qualified = false;
                }
            }
            if (!qualified && transaction.segments[i].tag === 'HL' && transaction.segments[i].valueOf(3) == pathParts[j]) {
                lastParentIndex = parseInt(segment.valueOf(2, '-1'));
                j++;
                if (j == pathParts.length) {
                    qualified = true;
                }
            }
            if (qualified) {
                matches.push(transaction.segments[i]);
            }
        }
        return matches;
    };
    X12QueryEngine.prototype._evaluateSegmentPathQueryPart = function (segments, segmentPath) {
        var qualified = false;
        var pathParts = segmentPath.split('-').filter(function (value, index, array) { return !!value; });
        var matches = new Array();
        for (var i = 0, j = 0; i < segments.length; i++) {
            if (qualified && (segments[i].tag == 'HL' || pathParts.indexOf(segments[i].tag) > -1)) {
                j = 0;
                qualified = false;
            }
            if (!qualified && segments[i].tag == pathParts[j]) {
                j++;
                if (j == pathParts.length) {
                    qualified = true;
                }
            }
            if (qualified) {
                matches.push(segments[i]);
            }
        }
        return matches;
    };
    X12QueryEngine.prototype._evaluateElementReferenceQueryPart = function (interchange, functionalGroup, transaction, segments, elementReference, qualifiers) {
        var reference = elementReference.replace(':', '');
        var tag = reference.substr(0, reference.length - 2);
        var pos = reference.substr(reference.length - 2, 2);
        var posint = parseInt(pos);
        var results = new Array();
        for (var i = 0; i < segments.length; i++) {
            var segment = segments[i];
            if (!segment) {
                continue;
            }
            if (segment.tag !== tag) {
                continue;
            }
            var value = segment.valueOf(posint, null);
            if (value && this._testQualifiers(transaction, segment, qualifiers)) {
                results.push(new X12QueryResult(interchange, functionalGroup, transaction, segment, segment.elements[posint - 1]));
            }
        }
        return results;
    };
    X12QueryEngine.prototype._testQualifiers = function (transaction, segment, qualifiers) {
        if (!qualifiers) {
            return true;
        }
        for (var i = 0; i < qualifiers.length; i++) {
            var qualifier = qualifiers[i].substr(1);
            var elementReference = qualifier.substring(0, qualifier.indexOf('['));
            var elementValue = qualifier.substring(qualifier.indexOf('[') + 2, qualifier.lastIndexOf(']') - 1);
            var tag = elementReference.substr(0, elementReference.length - 2);
            var pos = elementReference.substr(elementReference.length - 2, 2);
            var posint = parseInt(pos);
            for (var j = transaction.segments.indexOf(segment); j > -1; j--) {
                var seg = transaction.segments[j];
                var value = seg.valueOf(posint);
                if (seg.tag === tag && seg.tag === segment.tag && value !== elementValue) {
                    return false;
                }
                else if (seg.tag === tag && value === elementValue) {
                    break;
                }
                if (j == 0) {
                    return false;
                }
            }
        }
        return true;
    };
    return X12QueryEngine;
}());
exports.X12QueryEngine = X12QueryEngine;
var X12QueryResult = (function () {
    function X12QueryResult(interchange, functionalGroup, transaction, segment, element) {
        this.interchange = interchange;
        this.functionalGroup = functionalGroup;
        this.transaction = transaction;
        this.segment = segment;
        this.element = element;
    }
    return X12QueryResult;
}());
exports.X12QueryResult = X12QueryResult;
