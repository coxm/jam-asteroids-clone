import * as events from 'game/events';
import {ComponentDef, ComponentBase} from 'game/actors/index';
import {textures} from 'game/load/index';
import {Actor} from 'game/actors/index';


export interface HealthDef extends ComponentDef {
	readonly hitpoints: number;
}


export class Health extends ComponentBase {
	protected hitpoints: number;
	protected max: number;

	constructor(def: HealthDef, actorID: symbol) {
		super(actorID);
		this.max = this.hitpoints = def.hitpoints;
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


export class PlayerHealth extends Health {
	readonly renderable: PIXI.Sprite;

	constructor(def: HealthDef, actorID: symbol) {
		super(def, actorID);
		this.renderable = new PIXI.Sprite(
			textures.cached('HealthBar.png'));
		this.renderable.anchor.set(0, 8);
	}

	subtract(hitpoints: number): void {
		super.subtract(hitpoints);
		this.renderable.width = (
			this.renderable.texture.width * this.hitpoints / this.max) | 0;
	}

	onAdd(actor: Actor): void {
		super.onAdd(actor);
		const pos = actor.cmp.phys.body.position;
		this.renderable.position.set(pos[0], pos[1]);
	}
}
