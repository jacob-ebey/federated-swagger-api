"use strict";

const fetch = require("isomorphic-fetch");

const SwaggerContainerEntryDependency = require("./SwaggerContainerEntryDependency");
const SwaggerContainerEntryModuleFactory = require("./SwaggerContainerEntryModuleFactory");

const PLUGIN_NAME = "FederatedSwaggerApiPlugin";

/**
 * @typedef {object} FederatedSwaggerApiPluginOptions
 * @property {string} name
 * @property {string} filename
 * @property {string} swagger
 * @property {{ type: string, name: string } | undefined} library
 */

class FederatedSwaggerApiPlugin {
  /**
   *
   * @param {FederatedSwaggerApiPluginOptions} options
   */
  constructor(options) {
    this._options = {
      name: options.name,
      swagger: options.swagger,
      library: options.library || {
        type: "var",
        name: options.name,
      },
      filename: options.filename || undefined,
      baseUrl: options.baseUrl,
    };
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    const { name, swagger: providedSwagger, filename, library, baseUrl } = this._options;

    compiler.options.output.enabledLibraryTypes.push(library.type);

    compiler.hooks.make.tapAsync(PLUGIN_NAME, async (compilation, callback) => {
      let swagger = providedSwagger;
      if (typeof swagger === "string") {
        const res = await fetch(swagger);
        swagger = await res.json();
      }

      const dep = new SwaggerContainerEntryDependency(name, swagger, baseUrl);
      dep.loc = { name };
      compilation.addEntry(
        compilation.options.context,
        dep,
        {
          name,
          filename,
          library,
        },
        (error) => {
          if (error) return callback(error);
          callback();
        }
      );
    });

    compiler.hooks.thisCompilation.tap(
      PLUGIN_NAME,
      (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(
          SwaggerContainerEntryDependency,
          new SwaggerContainerEntryModuleFactory()
        );
      }
    );
  }
}

module.exports = FederatedSwaggerApiPlugin;
