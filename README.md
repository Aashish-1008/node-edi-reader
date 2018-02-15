
# node-edi-x12 reader
A simple ASC X12 parser for NodeJS. 

## Usage
```typescript
'use strict';

var X12Parser = require('X12Parser');
var X12QueryEngine = require('X12QueryEngine');
// parse (deserialize) X12 EDI
let parser = new X12Parser(true);
let interchange = parser.parseX12('...raw X12 data...',transactionTypeId);

transactionTypeId can be 837P.

// OR use the query engine to query a document
let engine = new X12QueryEngine(parser);
let results = engine.query('REF02:REF01["IA"]');

results.forEach((result) => {
    // do something with each result
    
    // result.interchange
    // result.functionalGroup
    // result.transaction
    // result.segment
    // result.element(.value)
});
```
