const webpack = require("webpack");
const fs = require("fs");

module.exports = {
  mode: "none",
  entry: {
    main: "./src/main.js",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync("./src/header.js", "utf8"),
      raw: true,
      entryOnly: true,
    }),
  ],
  output: {
    filename: "Pluralchum.plugin.js",
  },
};
