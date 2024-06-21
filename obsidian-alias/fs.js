/** @type {import('fs')} */
const fs = app.vault.adapter.fs;


// alot of functions needs to be overritten from app.vault.adapter.
const exported = {
    ...fs,
    isUsingObsidian: true
}

// Export all functions
module.exports = exported