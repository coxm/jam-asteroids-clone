import {State} from 'jam/states/State';

import {ActorDef, PartialActorDef} from 'game/actors/index';
import * as events from 'game/events';
import * as load from 'game/load/index';


interface SectorJSON {
	readonly actors: PartialActorDef[];
}


interface PreloadData {
	readonly actors: ActorDef[];
}


export class Sector extends State {
	protected async doPreload(): Promise<PreloadData> {
		const raw = await load.files.json<SectorJSON>(`sectors/${this.name}`);
		return {
			actors: await Promise.all(
				raw.actors.map(partial => load.actors.fromPartialDef(partial))
			),
		};
	}

	protected doStart(data: PreloadData): void {
		events.manager.fire(events.Category.sectorEntered, {
			actors: data.actors,
		});
	}
}
