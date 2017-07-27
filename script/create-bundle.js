const fs = require('fs');
const path = require('path');
const Builder = require('systemjs-builder');
const Uglify = require('uglify-es');


const baseUrl = '.';
const builder = new Builder(baseUrl, 'config/dist.system.js');


const includes = [
	'build/js/game/index.js',
];
function createSystemBundle() {
	return builder.buildStatic(includes.join(' + '), {
		externals: ['pixi'],
		globalDeps: ['PIXI'],
		runtime: false,
		minify: false,
		mangle: false,
	});
}
module.exports.createSystemBundle = createSystemBundle;


function minify({source}) {
	const results = Uglify.minify(source.toString(), {
		compress: true,
		mangle: true,
	});
	if (results.error) {
		console.log('Minification error', results.error);
		throw results.error;
	}

	const notice = fs.readFileSync('config/copyright.js', {encoding: 'utf8'});
	const output = [notice, results.code].join('\n');
	fs.writeFileSync('dist/game.js', output);
}
module.exports.minify = minify;


createSystemBundle()
.then(minify)
.then(() => {
	console.log('Minification complete');
})
.catch((err) => {
	console.log('Build error');
	console.error(err);
	process.exit(1);
});
