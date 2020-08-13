"use strict";

const Dependency = require("webpack/lib/Dependency");
const makeSerializable = require("webpack/lib/util/makeSerializable");

/** @typedef {import("./ContainerEntryModule").ExposeOptions} ExposeOptions */

class SwaggerContainerEntryDependency extends Dependency {
  /**
   * @param {string} name entry name
   * @param {object} swagger the swagger json
   */
  constructor(name, swagger, baseUrl) {
    super();
    this.name = name;
    this.swagger = swagger;
    this.baseUrl = baseUrl;
    this.optional = true;
  }

  /**
   * @returns {string | null} an identifier to merge equal requests
   */
  getResourceIdentifier() {
    return `swagger-container-entry-${this.name}`;
  }

  get type() {
    return "swagger-container entry";
  }

  get category() {
    return "esm";
  }
}

makeSerializable(
  SwaggerContainerEntryDependency,
  "swagger-container/SwaggerContainerEntryDependency"
);

module.exports = SwaggerContainerEntryDependency;
