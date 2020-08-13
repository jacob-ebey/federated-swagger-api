"use strict";

const { OriginalSource } = require("webpack-sources");
const AsyncDependenciesBlock = require("webpack/lib/AsyncDependenciesBlock");
const Module = require("webpack/lib/Module");
const RuntimeGlobals = require("webpack/lib/RuntimeGlobals");
const Template = require("webpack/lib/Template");
const makeSerializable = require("webpack/lib/util/makeSerializable");

/** @typedef {import("webpack/declarations/WebpackOptions").WebpackOptionsNormalized} WebpackOptions */
/** @typedef {import("webpack/lib/ChunkGraph")} ChunkGraph */
/** @typedef {import("webpack/lib/ChunkGroup")} ChunkGroup */
/** @typedef {import("webpack/lib/Compilation")} Compilation */
/** @typedef {import("webpack/lib/Module").CodeGenerationContext} CodeGenerationContext */
/** @typedef {import("webpack/lib/Module").CodeGenerationResult} CodeGenerationResult */
/** @typedef {import("webpack/lib/Module").LibIdentOptions} LibIdentOptions */
/** @typedef {import("webpack/lib/Module").NeedBuildContext} NeedBuildContext */
/** @typedef {import("webpack/lib/RequestShortener")} RequestShortener */
/** @typedef {import("webpack/lib/ResolverFactory").ResolverWithOptions} ResolverWithOptions */
/** @typedef {import("webpack/lib/WebpackError")} WebpackError */
/** @typedef {import("webpack/lib/util/Hash")} Hash */
/** @typedef {import("webpack/lib/util/fs").InputFileSystem} InputFileSystem */

/** @typedef {import("./SwaggerContainerEntryDependency")} SwaggerContainerEntryDependency */

/**
 * @typedef {Object} ExposeOptions
 * @property {string[]} import requests to exposed modules (last one is exported)
 */

const SOURCE_TYPES = new Set(["javascript"]);

class ContainerEntryModule extends Module {
  /**
   * @param {string} name container entry name
   * @param {[string, ExposeOptions][]} exposes list of exposed modules
   * @param {string} shareScope name of the share scope
   */
  constructor(name, swagger, baseUrl) {
    super("javascript/dynamic", null);
    this._name = name;
    this._swagger = swagger;
    this._baseUrl = baseUrl;
  }

  /**
   * @returns {Set<string>} types available (do not mutate)
   */
  getSourceTypes() {
    return SOURCE_TYPES;
  }

  /**
   * @returns {string} a unique identifier of the module
   */
  identifier() {
    return `swagger-container entry`;
  }

  /**
   * @param {RequestShortener} requestShortener the request shortener
   * @returns {string} a user readable identifier of the module
   */
  readableIdentifier(requestShortener) {
    return `swagger-container entry`;
  }

  /**
   * @param {LibIdentOptions} options options
   * @returns {string | null} an identifier for library inclusion
   */
  libIdent(options) {
    return `swagger-container/entry/${this._name}`;
  }

  /**
   * @param {NeedBuildContext} context context info
   * @param {function(WebpackError=, boolean=): void} callback callback function, returns true, if the module needs a rebuild
   * @returns {void}
   */
  needBuild(context, callback) {
    return callback(null, !this.buildMeta);
  }

  /**
   * @param {WebpackOptions} options webpack options
   * @param {Compilation} compilation the compilation
   * @param {ResolverWithOptions} resolver the resolver
   * @param {InputFileSystem} fs the file system
   * @param {function(WebpackError=): void} callback callback function
   * @returns {void}
   */
  build(options, compilation, resolver, fs, callback) {
    this.buildMeta = {};
    this.buildInfo = {
      strict: true,
    };

    this.clearDependenciesAndBlocks();

    callback();
  }

  /**
   * @param {CodeGenerationContext} context context for code generation
   * @returns {CodeGenerationResult} result
   */
  codeGeneration({ moduleGraph, chunkGraph, runtimeTemplate }) {
    const sources = new Map();
    const runtimeRequirements = new Set([
      RuntimeGlobals.definePropertyGetters,
      RuntimeGlobals.hasOwnProperty,
      RuntimeGlobals.exports,
    ]);

    const getters = [];

    for (const [path, routeOptions] of Object.entries(this._swagger.paths)) {
      const str = Template.asString([
        `const path = ${JSON.stringify(
          path
        )}.replace(/\\{([\\w\\d\\_\\-]+)\\}/g, (_, match) => params.get(match));`,
        `return fetch(baseUrl + path)`,
        Template.indent([
          ".then(res => res.json())",
          ".then(json => () => json)",
        ]),
      ]);

      getters.push(
        `${JSON.stringify(`.${path}`)}: ${runtimeTemplate.basicFunction(
          "params",
          str
        )}`
      );
    }

    const source = Template.asString([
      `const baseUrl = ${JSON.stringify(this._baseUrl)};`,
      `var moduleMap = {`,
      Template.indent(getters.join(",\n")),
      "};",
      `var get = ${runtimeTemplate.basicFunction("requestedModule", [
        `const splitModule = requestedModule.split("?");`,
        `const module = splitModule[0];`,
        `const params = new URLSearchParams(splitModule[1]);`,
        "return (",
        Template.indent([
          `${RuntimeGlobals.hasOwnProperty}(moduleMap, module)`,
          Template.indent([
            "? moduleMap[module](params)",
            `: Promise.resolve().then(${runtimeTemplate.basicFunction(
              "",
              "throw new Error('Module \"' + module + '\" does not exist in container.');"
            )})`,
          ]),
        ]),
        ");",
      ])};`,
      `var init = ${runtimeTemplate.basicFunction("shareScope", [])};`,
      "",
      "// This exports getters to disallow modifications",
      `${RuntimeGlobals.definePropertyGetters}(exports, {`,
      Template.indent([
        `get: ${runtimeTemplate.returningFunction("get")},`,
        `init: ${runtimeTemplate.returningFunction("init")}`,
      ]),
      "});",
    ]);

    sources.set(
      "javascript",
      new OriginalSource(source, "swagger-container/entry")
    );

    return {
      sources,
      runtimeRequirements,
    };
  }

  /**
   * @param {string=} type the source type for which the size should be estimated
   * @returns {number} the estimated size of the module (must be non-zero)
   */
  size(type) {
    return 42;
  }

  serialize(context) {
    const { write } = context;
    write(this._name);
    write(this._swagger);
    super.serialize(context);
  }

  static deserialize(context) {
    const { read } = context;
    const obj = new ContainerEntryModule(read(), read());
    obj.deserialize(context);
    return obj;
  }
}

makeSerializable(
  ContainerEntryModule,
  "swagger-container/SwaggerContainerEntryModule"
);

module.exports = ContainerEntryModule;
