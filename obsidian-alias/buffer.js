/** Buffer polyfill for mobile (iOS) where Node.js globals are unavailable. */
module.exports = require('buffer');
module.exports.Buffer = require('buffer').Buffer;
