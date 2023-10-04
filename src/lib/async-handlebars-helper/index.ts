import { registerCoreHelpers } from "./helpers";
import type Handlebars from "handlebars";
export default function asyncHelpers(handlebars: any): typeof Handlebars {
  const _compile = handlebars.compile,
    _template = handlebars.VM.template,
    _mergeSource = handlebars.JavaScriptCompiler.prototype.mergeSource;

  handlebars.JavaScriptCompiler.prototype.mergeSource = function (
    varDeclarations: any
  ) {
    const sources = _mergeSource.call(this, varDeclarations);
    return sources.prepend("return (async () => {").add(" })()");
  };

  handlebars.JavaScriptCompiler.prototype.appendToBuffer = function (
    source: any,
    location: any,
    explicit: any
  ) {
    // Force a source as this simplifies the merge logic.
    if (!Array.isArray(source)) {
      source = [source];
    }
    source = this.source.wrap(source, location);

    if (this.environment.isSimple) {
      return ["return await ", source, ";"];
    }
    if (explicit) {
      // This is a case where the buffer operation occurs as a child of another
      // construct, generally braces. We have to explicitly output these buffer
      // operations to ensure that the emitted code goes in the correct location.
      return ["buffer += await ", source, ";"];
    }
    source.appendToBuffer = true;
    source.prepend("await ");
    return source;
  };

  handlebars.template = function (spec: any) {
    spec.main_d =
      (
        prog: any,
        props: any,
        container: any,
        depth: any,
        data: any,
        blockParams: any,
        depths: any
      ) =>
      async (context: any) => {
        // const main = await spec.main
        const v = spec.main(
          container,
          context,
          container.helpers,
          container.partials,
          data,
          blockParams,
          depths
        );
        return v;
      };
    return _template(spec, handlebars);
  };

  handlebars.compile = function () {
    const compiled = _compile.apply(handlebars, [
      // @ts-ignore
      // eslint-disable-next-line prefer-rest-params
      ...arguments,
      { noEscape: true },
    ]);

    return function (context: any, execOptions: any) {
      context = context || {};

      return compiled.call(handlebars, context, execOptions);
    };
  };

  registerCoreHelpers(handlebars);

  return handlebars;
}
