const { isPromise, isEmpty } = require('../utils')


module.exports = (handlebars) => {
    handlebars.registerHelper('if', async function(conditional, options) {
        if (arguments.length !== 2) {
            throw new Error('#if requires exactly one argument');
        }
        if (typeof conditional === 'function') {
            conditional = conditional.call(this);
        } else if (isPromise(conditional)) {
            conditional = await conditional
        }

        // Default behavior is to render the positive path if the value is truthy and not empty.
        // The `includeZero` option may be set to treat the condtional as purely not empty based on the
        // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
        if ((!options.hash.includeZero && !conditional) || isEmpty(conditional)) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    });

    handlebars.registerHelper('unless', function(conditional, options) {
        if (arguments.length !== 2) {
            throw new Error('#unless requires exactly one argument');
        }
        return handlebars.helpers['if'].call(this, conditional, {
            fn: options.inverse,
            inverse: options.fn,
            hash: options.hash
        });
    });
}