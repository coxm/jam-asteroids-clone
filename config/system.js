/**
 * @file config/system.js
 *
 * Development SystemJS configuration.
 */


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
		"systemjs": "node_modules/systemjs/dist/system.js",
		"text.js": "node_modules/systemjs-plugin-text/text.js",
		"json.js": "node_modules/systemjs-plugin-json/json.js",
		"game": "build/js/game",
		"jam": "build/js/jam",
		"p2": "node_modules/p2/build/p2.js",
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


window.onerror = function(e) {
	console.log('Intercepted SystemJS error. Details to follow.')
	console.error(e.message);
};


System.import('build/js/game/index.js').then(
	() => { console.log('Loaded game'); },
	(err) => { console.error(err.message || err); }
);
