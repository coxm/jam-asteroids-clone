import {ActorLoader} from 'jam/actors/Loader';
import {cache} from './cache';


export class CachedActorLoader extends ActorLoader {
	/** All loaded files will be stored in this cache. */
	readonly cache: Map<string, any>;

	@cache
	actorDef(relpath: string): Promise<ActorDef> {
		return super.actorDef(relpath);
	}
}
