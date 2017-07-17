import {TextureLoader} from 'jam/load/TextureLoader';

import {CachedFileLoader} from './CachedFileLoader';
import {CachedActorLoader} from './CachedActorLoader';


export const files = new CachedFileLoader({
	baseUrl: 'assets',
	suffix: '.json!text.js',
});


export const actors = new CachedActorLoader({
	baseUrl: 'assets/actors',
	suffix: '.json!text.js',
});


export const textures = new TextureLoader({
	baseUrl: 'assets/img'
});
