const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "."),
    filename: "extension.js",
    library: {
      type: "umd",
      name: "SubjournalsExtension",
    },
    globalObject: "this",
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
    // These will use the global variables Roam provides
    react: "React",
    "react-dom": "ReactDOM",
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
  target: "web",
};
