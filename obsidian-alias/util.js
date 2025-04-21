/** @type {import('util')} */
const util = {
    // Common utility functions
    inspect: (obj, options) => JSON.stringify(obj, null, 2),
    format: (...args) => {
        if (args.length === 0) return '';
        const format = args[0];
        let i = 1;
        return format.replace(/%[sdj%]/g, (match) => {
            if (match === '%%') return '%';
            if (i >= args.length) return match;
            const val = args[i++];
            switch (match) {
                case '%s': return String(val);
                case '%d': return Number(val).toString();
                case '%j': return JSON.stringify(val);
                default: return match;
            }
        });
    },
    promisify: (fn) => {
        return (...args) => {
            return new Promise((resolve, reject) => {
                fn(...args, (err, ...results) => {
                    if (err) return reject(err);
                    if (results.length === 1) return resolve(results[0]);
                    resolve(results);
                });
            });
        };
    },
    types: {
        isDate: (obj) => Object.prototype.toString.call(obj) === '[object Date]',
        isRegExp: (obj) => Object.prototype.toString.call(obj) === '[object RegExp]',
        isArray: Array.isArray,
        isObject: (obj) => obj !== null && typeof obj === 'object',
        isFunction: (obj) => typeof obj === 'function',
    },
    
    // Add isUsingObsidian flag like other modules
    isUsingObsidian: true
};

module.exports = util;
