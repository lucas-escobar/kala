const path = require("path");

module.exports = {
  entry: "./src/index.js", // Update with your main JavaScript file
  output: {
    path: path.resolve(__dirname, "dist"), // Update with your output directory
    filename: "bundle.js", // Update with your desired bundle filename
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
  resolve: {
    alias: {
      three: path.resolve(
        __dirname,
        "node_modules/three/build/three.module.min.js"
      ),
    },
  },
};
