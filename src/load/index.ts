import {CachedFileLoader} from './FileLoader';


export const files = new CachedFileLoader({
	baseUrl: 'assets',
	suffix: '.json!text.js',
});
