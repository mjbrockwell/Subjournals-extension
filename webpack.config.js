const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "."),
    filename: "extension.js",
    library: {
      type: "module",
    },
  },
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  externals: {
    // Use global variables that Roam provides
    react: "globalThis.React",
    "react-dom": "globalThis.ReactDOM",
  },
  resolve: {
    alias: {
      "roamjs-components": path.resolve(
        __dirname,
        "node_modules/roamjs-components"
      ),
    },
  },
  mode: "production",
};
