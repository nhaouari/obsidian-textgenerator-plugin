module.exports = {
    registerCoreHelpers: (handlebars) => {
        require('./each')(handlebars)
        require('./if')(handlebars)
        require('./with')(handlebars)
    }
}