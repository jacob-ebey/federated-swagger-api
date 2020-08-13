const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

const FederatedSwaggerApiPlugin = require("./federated-swagger-api-plugin");

module.exports = (_, { mode }) => {
  const isProd = mode === "production";

  const entry = ["./temp-entry"];
  if (!isProd) {
    entry.unshift("preact/debug");
  }

  return {
    devServer: {
      contentBase: path.join(__dirname, "dist"),
      port: 3001,
    },
    devtool: "inline-source-map",
    entry,
    mode: isProd ? "production" : "development",
    optimization: {
      minimize: isProd,
    },
    resolve: {
      extensions: [".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: "babel-loader",
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin(),
      new FederatedSwaggerApiPlugin({
        name: "swquotes",
        filename: "swquotesapi-entry.js",
        swagger: "http://swquotesapi.digitaljedi.dk/swagger/v1/swagger.json",
        baseUrl: "http://swquotesapi.digitaljedi.dk",
      }),
      new ModuleFederationPlugin({
        name: "dynamic_import_data_host",
        filename: "remote-entry.js",
        remotes: {
          swquotes: "swquotes@http://localhost:3001/swquotesapi-entry.js",
        },
      }),
    ],
  };
};
