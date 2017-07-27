import {TextureLoader} from 'jam/load/TextureLoader';

import {DEV} from 'game/settings';

import {CachedFileLoader} from './CachedFileLoader';
import {CachedActorLoader} from './CachedActorLoader';


const suffix = '.json';


export const files = new CachedFileLoader({
	baseUrl: 'assets',
	suffix,
});


export const actors = new CachedActorLoader({
	baseUrl: 'assets/actors',
	suffix,
});


export const textures = new TextureLoader({
	baseUrl: DEV ? 'dist/img' : 'img',
});
