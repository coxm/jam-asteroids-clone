import {Loader} from 'jam/actors/Loader';

import {ActorDef} from 'game/actors/index';
import {CachedFileLoader} from './CachedFileLoader';
import {cache} from './cache';


export class CachedActorLoader extends Loader {
	/** All loaded files will be stored in this cache. */
	readonly cache: Map<string, any>;

	@cache
	actorDef(relpath: string): Promise<ActorDef> {
		return super.actorDef(relpath);
	}
}
CachedActorLoader.prototype.json = CachedFileLoader.prototype.json;
