import * as events from 'game/events';
import {ComponentDef, ComponentBase} from 'game/actors/index';


export interface HealthDef extends ComponentDef {
	readonly hitpoints: number;
}


export class Health extends ComponentBase {
	private hitpoints: number;

	constructor(def: HealthDef, actorID: symbol) {
		super(actorID);
		this.hitpoints = def.hitpoints;
	}

	subtract(hitpoints: number): void {
		this.hitpoints -= hitpoints;
		if (this.hitpoints < 0) {
			events.manager.fire(events.Category.actorHasNoHealth, {
				actorID: this.actorID,
			});
		}
	}
}
