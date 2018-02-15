'use strict';
var Position = (function () {
    function Position(line, character) {
        if (typeof line === 'number' && typeof character === 'number') {
            this.line = line;
            this.character = character;
        }
    }
    return Position;
}());
exports.Position = Position;
var Range = (function () {
    function Range(startLine, startChar, endLine, endChar) {
        if (typeof startLine === 'number' && typeof startChar === 'number' && typeof endLine === 'number' && typeof endChar === 'number') {
            this.start = new Position(startLine, startChar);
            this.end = new Position(endLine, endChar);
        }
    }
    return Range;
}());
exports.Range = Range;
