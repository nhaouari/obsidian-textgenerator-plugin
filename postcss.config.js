// postcss.config.js

const cssnano = require("cssnano");

module.exports = {
	plugins: [
		require("postcss-import"),
		require("tailwindcss"),
		require("autoprefixer"),
	],
};
