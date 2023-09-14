module.exports = {
	content: ["./src/**/*.{ts,jsx,tsx,vue,css}"],

	darkMode: ["class", '[class*="theme-dark"]'], // or 'media' or 'class'
	plugins: [require("daisyui")],

	daisyui: {
		prefix: "dz-", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
		logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
	},
};
