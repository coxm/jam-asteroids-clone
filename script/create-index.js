const fs = require('fs');
const cheerio = require('cheerio');
const htmlmin = require('html-minifier');


const source = fs.readFileSync('./index.html', {encoding: 'utf8'});
const $ = cheerio.load(source);


$('script').each((i, e) => {
	e = $(e);
	let dist = e.attr('dist');
	if (!dist) {
		e.remove();
		return;
	}
	e.attr('src', dist).removeAttr('dist');
});


$('audio').each((i, e) => {
	e = $(e);
	e.attr('src', e.attr('src').replace(/^\/dist\//, ''));
});


const minified = htmlmin.minify($.html(), {
	caseSensitive: true,
	collapseBooleanAttributes: true,
	collapseInlineTagWhitespace: true,
	collapseWhitespace: true,
	preserveLineBreaks: false,
	html5: true,
	minifyCss: true,
	minifyJs: true,
	quoteCharacter: '"',
});


fs.writeFileSync('./dist/index.html', minified);
