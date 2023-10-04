const should = require('should'),
    { PassThrough } = require('stream'),
    Handlebars = require('handlebars'),
    asyncHelpers = require('../index')
const { resolve } = require('eslint-plugin-promise/rules/lib/promise-statics')

describe('Test async helpers', () => {

    it('Test single async helper', async () => {
        const hbs = asyncHelpers(Handlebars)

        hbs.registerHelper('sleep', async () => new Promise((resolve) => {
            setTimeout(() => resolve('Done!'), 1000)
        }))

        const result = await hbs.compile('Mark when is completed: {{#sleep}}{{/sleep}}')()
        should.equal(result, 'Mark when is completed: Done!')

    })

    it('Test async helper with partial template', async () => {
        const hbs = asyncHelpers(Handlebars)
        hbs.registerPartial('myPartial', 'Some text: {{#sleep}}{{/sleep}}')
        hbs.registerHelper('sleep', async () => new Promise((resolve) => {
            setTimeout(() => resolve('Done!'), 1000)
        }))

        const result = await hbs.compile('Mark when is completed: {{> myPartial}}')()
        should.equal(result, 'Mark when is completed: Some text: Done!')

    })

    it('Test each helper with async helpers inside', async () => {
        const hbs = asyncHelpers(Handlebars)
        hbs.registerHelper('sleep', async () => new Promise((resolve) => {
            setTimeout(() => resolve('Done!'), 1000)
        }))

        const items = [
                'Gaston',
                'Joaquin',
                'James',
                'Ala',
                'Giannis',
                'Adam',
                'Drew'
            ],
            result = await hbs.compile('Devs \n{{#each items}}Dev: {{this}} {{#sleep}}{{/sleep}}\n{{/each}}')({items})
        should.equal(result, 'Devs \nDev: Gaston Done!\nDev: Joaquin Done!\nDev: James Done!\nDev: Ala Done!\nDev: Giannis Done!\nDev: Adam Done!\nDev: Drew Done!\n')

    })

    it('Test each helper with async helpers resolver', async () => {
        const hbs = asyncHelpers(Handlebars),
            items = Promise.resolve([
                'Gaston',
                'Joaquin',
                'James',
                'Ala',
                'Giannis',
                'Adam',
                'Drew'
            ])
        hbs.registerHelper('getArray', () => new Promise((resolve) => {
            setTimeout(() => resolve(items), 1000)
        }))

        const result = await hbs.compile('Devs \n{{#each (getArray items)}}Dev: {{this}}\n{{/each}}')({items})
        should.equal(result, 'Devs \nDev: Gaston\nDev: Joaquin\nDev: James\nDev: Ala\nDev: Giannis\nDev: Adam\nDev: Drew\n')

    })

    it('Test with helper', async () => {
        const hbs = asyncHelpers(Handlebars),
            template = `<div class="names">
                        <ul>
                            <li>John, Q</li>
                            <li>John, McKlein</li>
                            <li>Susan, Morrison</li>
                            <li>Mick, Jagger</li>
                        </ul>
                      </div>
                      <div>
                        {{#with (ipInfo)}}
                        <p>Country: {{country}}</p>
                        {{/with}}
                      </div>`,
            expected = `<div class="names">
                        <ul>
                            <li>John, Q</li>
                            <li>John, McKlein</li>
                            <li>Susan, Morrison</li>
                            <li>Mick, Jagger</li>
                        </ul>
                      </div>
                      <div>
                        <p>Country: Canada</p>
                      </div>`
        hbs.registerHelper('ipInfo', async () => {
            await new Promise((resolve) => {
                setTimeout(resolve, 500)
            })
            return {country: 'Canada'}
        })
        const compiled = hbs.compile(template),
            result = await compiled({
                person: [
                    {firstName: 'John', lastName: 'Q'},
                    {firstName: 'John', lastName: 'McKlein'},
                    {firstName: 'Susan', lastName: 'Morrison'},
                    {firstName: 'Mick', lastName: 'Jagger'}
                ]
            })
        should.equal(result, expected)
    })

    it('Test if helper', async () => {
        const hbs = asyncHelpers(Handlebars),
            template = `{{#if (shouldShow data)}}<p>Show</p>{{else}}<p>No Show</p>{{/if}}`,
            expected = `<p>Show</p>`
        hbs.registerHelper('shouldShow', async () => {
            await new Promise((resolve) => {
                setTimeout(resolve, 500)
            })
            return true
        })
        const compiled = hbs.compile(template),
            result = await compiled({
                data: {}
            })
        should.equal(result, expected)
    })

    it('Test unless helper', async () => {
        const hbs = asyncHelpers(Handlebars),
            template = `{{#unless (shouldShow data)}}<p>Show</p>{{/unless}}`,
            expected = `<p>Show</p>`
        hbs.registerHelper('shouldShow', async () => {
            await new Promise((resolve) => {
                setTimeout(resolve, 500)
            })
            return null
        })
        const compiled = hbs.compile(template),
            result = await compiled({
                data: {}
            })
        should.equal(result, expected)
    })

    it('Test with custom helpers and complex replacements', async() => {
        const timeout = ms => new Promise(res => setTimeout(res, ms)),
                delay = async function delayFn() {
                    await timeout(100)
                    return 1000
                },
            hbs = asyncHelpers(Handlebars)

        hbs.registerHelper({
            extend: async function(partial, options) {
                let context = this,
                    // noinspection JSUnresolvedVariable
                    template = Handlebars.partials[partial] || options.data?.partials?.partial

                // Partial template required
                if (typeof template === 'undefined') {
                    throw new Error("Missing layout partial: '" + partial + "'")
                }

                // Parse blocks and discard output
                await options.fn(context)

                if (!(typeof template === 'function')) {
                    template = Handlebars.compile(template)
                }

                // Render final layout partial with revised blocks
                return template(context, options)
            },
            append: function(block, options) {
                this.blocks = this.blocks || {}
                this.blocks[block] = {
                    should: 'append',
                    fn: options.fn
                }
            },
            prepend: function(block, options) {
                this.blocks = this.blocks || {}
                this.blocks[block] = {
                    should: 'prepend',
                    fn: options.fn
                }
            },
            replace: function(block, options) {
                this.blocks = this.blocks || {}
                this.blocks[block] = {
                    should: 'replace',
                    fn: options.fn
                }
            },
            block: function(name, options) {
                this.blocks = this.blocks || {}
                let block = this.blocks[name]
                let results = []
                switch (block && block.fn && block.should) {
                    case 'append':
                        results.push(options.fn(this))
                        results.push(block.fn(this))
                        break
                    case 'prepend':
                        results.push(block.fn(this))
                        results.push(options.fn(this))
                        break
                    case 'replace':
                        results.push(block.fn(this))
                        break
                    default:
                        results.push(options.fn(this))
                        break
                }
                return Promise.all(results).then(results => results.join(''))
            }
        })

        hbs.registerHelper('delay', delay)
        hbs.registerHelper('cursor', async(options) => {
            await timeout(1000)
            return [{ name: 'test' }, { name: 'test2' }]
        })

        hbs.registerPartial('layout', '<html><body><h1>Layout</h1><div>{{#block "body_replace"}}<i>Text before</i>{{/block}}</div><div>{{#block "body_append"}}<i>Text before content</i>{{/block}}</div><div>{{#block "body_prepend"}}<i>Text after content</i>{{/block}}</div></body></html>')
        const compiled = hbs.compile(`{{#extend "layout"}}{{#prepend "body_prepend"}}{{#each (cursor)}}{{#if @first}}<span>test first</span>{{/if}}<div><h2>{{name}}</h2><p>{{#delay}}{{/delay}}</p></div>{{/each}}{{/prepend}}{{#append "body_append"}}{{#each (cursor)}}<div><a>{{name}}</a><p>{{#delay}}{{/delay}}</p></div>{{/each}}{{/append}}{{#replace "body_replace"}}<ul>{{#each (cursor)}}<li>{{name}} - {{#delay}}{{/delay}}</li>{{/each}}</ul>{{/replace}}{{/extend}}`),
              expected = '<html><body><h1>Layout</h1><div><ul><li>test - 1000</li><li>test2 - 1000</li></ul></div><div><i>Text before content</i><div><a>test</a><p>1000</p></div><div><a>test2</a><p>1000</p></div></div><div><span>test first</span><div><h2>test</h2><p>1000</p></div><div><h2>test2</h2><p>1000</p></div><i>Text after content</i></div></body></html>'

        should.equal(await compiled(), expected)



    })

    it('Test single variable be a promise value', async () => {
        const hbs = asyncHelpers(Handlebars),
          template = `<p>{{value}}</p>`,
          expected = `<p>Gaston Robledo</p>`
        const compiled = hbs.compile(template),
              result = await compiled({
                  value: new Promise((resolve) => resolve('Gaston Robledo'))
              })
        should.equal(result, expected)
    })

    it('Test each with a stream source', async () => {
        const hbs = asyncHelpers(Handlebars),
          template = `{{#each source}}<p>{{this}}</p>{{/each}}`,
          expected = `<p>Gaston</p><p>Joaquin</p><p>James</p>`,
          source = new PassThrough()
        source.push('Gaston')
        source.push('Joaquin')
        source.end('James')
        const compiled = hbs.compile(template),
              result = await compiled({
                  source
              })
        should.equal(result, expected)
    })

    it('Test normal usage of handlebars', async () => {
        const hbs = asyncHelpers(Handlebars),
          template = `{{#each source}}<p>{{this}}</p>{{/each}}{{#if showThis}}<p>Showed</p>{{/if}}`,
          expected = `<p>Gaston</p><p>Joaquin</p><p>James</p><p>Showed</p>`,
          compiled = hbs.compile(template),
          result = await compiled({
              source: ['Gaston', 'Joaquin', 'James'],
              showThis: true
          })
        should.equal(result, expected)
    })
})
