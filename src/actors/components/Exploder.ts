import {ComponentDef, ComponentBase} from 'game/actors/index';


export interface ExploderDef extends ComponentDef {
	readonly debris: string;
	readonly offset: AnyVec2;
	readonly count: number;
	readonly speed: number;
	readonly stage: string;
}


export class Exploder extends ComponentBase {
	constructor(readonly def: ExploderDef, actorID: symbol) {
		super(actorID);
	}
}
