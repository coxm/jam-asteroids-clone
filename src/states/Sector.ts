import {State} from 'jam/states/State';

import {ActorDef, PartialActorDef} from 'game/actors/index';
import * as load from 'game/load/index';


interface SectorJSON {
	readonly actors: PartialActorDef[];
}


export interface SectorPreloadData {
	readonly actors: ActorDef[];
}


export class Sector extends State {
	protected async doPreload(): Promise<SectorPreloadData> {
		const raw = await load.files.json<SectorJSON>(`sectors/${this.name}`);
		return {
			actors: await Promise.all(
				raw.actors.map(partial => load.actors.fromPartialDef(partial))
			),
		};
	}
}
