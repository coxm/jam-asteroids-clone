System.config({
	packages: {
		assets: {
			defaultExtension: 'json',
		},
		jam: {
			defaultExtension: 'js',
		},
		game: {
			defaultExtension: 'js',
		},
	},
	map: {
		"jam": "build/js/jam",
		"game": "build/js/game",
		"systemjs": "node_modules/systemjs/dist/system.js",
		"text.js": "node_modules/systemjs-plugin-text/text.js",
		"json.js": "node_modules/systemjs-plugin-json/json.js",
		"p2": "node_modules/p2/build/p2.js",
		"dist/assets": "assets",
	},
	meta: {
		// Load p2 as a global module because we're already including it.
		p2: {
			format: 'global',
			exports: 'p2',
		},
		"assets/*.json": {
			loader: 'json.js',
		},
	},
	transpiler: null,
});
