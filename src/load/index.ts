import {TextureLoader} from 'jam/load/TextureLoader';
import {Loader as ActorLoader} from 'jam/actors/Loader';

import {CachedFileLoader} from './CachedFileLoader';


export const files = new CachedFileLoader({
	baseUrl: 'assets',
	suffix: '.json!text.js',
});


export const actors = new ActorLoader({
	baseUrl: 'assets/actors',
	suffix: '.json!text.js',
});


export const textures = new TextureLoader({
	baseUrl: 'assets/img'
});
