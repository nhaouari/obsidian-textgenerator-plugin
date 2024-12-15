/** @type {import('process')} */
const process = {
    // Basic process properties that are commonly used
    env: {},
    platform: 'web',
    version: '1.0.0',
    versions: {},
    arch: 'unknown',

    // Common methods
    cwd: () => '/',
    chdir: () => { },
    exit: () => { },

    // Add isUsingObsidian flag like fs.js
    isUsingObsidian: true
};

module.exports = process;
