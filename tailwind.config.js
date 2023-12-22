module.exports = {
	// prefix: "plug-tg-",
	content: ["./src/**/*.{ts,jsx,tsx,vue,css}"],
	corePlugins: {
		preflight: false,
	},
	darkMode: false,
	// darkMode: ["class", '[class*="theme-dark"]'], // or 'media' or 'class'
	plugins: [
		require("daisyui"),
		require("tailwindcss-animate"), require("@tailwindcss/forms")
	],

	daisyui: {
		prefix: "dz-", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
		logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
		themes: [
			{
				dark: {
					...require("daisyui/src/theming/themes")["dark"],
					"base-100": "rgb(42, 42, 42)",
				},
			},
			"light",
			// "cupcake",
		],
	},
};
