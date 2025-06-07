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
    // Don't bundle these - Roam provides them globally
    react: "React",
    "react-dom": "ReactDOM",
  },
  resolve: {
    alias: {
      // Help webpack find roamjs-components
      "roamjs-components": path.resolve(
        __dirname,
        "node_modules/roamjs-components"
      ),
    },
  },
  mode: "production",
};
