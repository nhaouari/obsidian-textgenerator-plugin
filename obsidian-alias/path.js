/** @type {import('fs/promises')} */
const path = app.vault.adapter.path;


const exported = {
    ...path,
    isUsingObsidian: true
}

// Export all functions
module.exports = exported