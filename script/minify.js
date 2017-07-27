#!/usr/bin/env node
const fs = require('fs');


const inputPath = process.argv[2];
const outputPath = process.argv[3];


if (!inputPath || !outputPath) {
	console.log('Usage:', process.argv[0], '<input> <output>');
	process.exit(1);
}


console.log('minify', inputPath, outputPath);


const options = {encoding: 'utf8'};
const input = fs.readFileSync(inputPath, options);
const output = JSON.stringify(JSON.parse(input));
fs.writeFileSync(outputPath, output, options);
