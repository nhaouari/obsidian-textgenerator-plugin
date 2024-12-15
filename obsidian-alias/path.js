
const pathbrowserify = require("path-browserify");

/** @type {import('fs/promises')} */
const path = app.vault.adapter.path;


const exported = {
    ...(path || pathbrowserify),
    isUsingObsidian: true
}

// Export all functions
module.exports = exported