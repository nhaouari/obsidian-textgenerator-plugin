/** @type {import('fs/promises')} */
const fsPromises = app.vault.adapter.fsPromises;

// alot of functions needs to be overritten from app.vault.adapter

const exported = {
    ...fsPromises,
    isUsingObsidian: true
}

// Export all functions
module.exports = exported