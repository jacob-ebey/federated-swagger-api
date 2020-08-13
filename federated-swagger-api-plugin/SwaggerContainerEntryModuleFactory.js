"use strict";

const ModuleFactory = require("webpack/lib/ModuleFactory");

const SwaggerContainerEntryModule = require("./SwaggerContainerEntryModule");

/** @typedef {import("./SwaggerContainerEntryDependency")} SwaggerContainerEntryDependency */

class SwaggerContainerEntryModuleFactory extends ModuleFactory {
  create({ dependencies: [dependency] }, callback) {
    const dep = /** @type {SwaggerContainerEntryDependency} */ (dependency);
    callback(null, {
      module: new SwaggerContainerEntryModule(dep.name, dep.swagger, dep.baseUrl),
    });
  }
}

module.exports = SwaggerContainerEntryModuleFactory;
