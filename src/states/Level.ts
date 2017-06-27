import {State} from 'jam/states/State';

import {Actor} from 'game/actors/index';
import {files} from 'game/load/index';


export interface LevelPreloadData {
}


export class Level extends State {
	private stage = new PIXI.Container();
	private actors = new Map<symbol | string, Actor>();

	protected doPreload(): Promise<LevelPreloadData> {
		return files.json(`levels/${this.name}`);
	}

	protected doInit(data: LevelPreloadData): void {
	}

	protected doDeinit(): void {
		this.stage.removeChildren();
		this.actors.clear();
	}
}
