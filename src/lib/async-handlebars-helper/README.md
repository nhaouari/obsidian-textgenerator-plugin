# Handlebars Async Helpers

Library that adds support to asynchronous function helpers to handlebars lib.

### How to install
```shell
npm install handlerbars-async-helpers
```

### Hot wo use it.
```javascript
const handlebars = require('handlebars'),
      asyncHelpers = require('handlebars-async-helpers')

const hb = asyncHelpers(handlebars)

hb.registerHelper('sleep', async () => new Promise((resolve) => {
    setTimeout(() => resolve('Done!'), 1000)
}))

const template = hb.compile('Mark when is completed: {{#sleep}}{{/sleep}}')
const result = await template()
console.log(result)
// 'Mark when is completed: Done!'
```
