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
		if (this.hitpoints <= 0) {
			events.manager.fire(events.Category.actorHasNoHealth, {
				actorID: this.actorID,
			});
		}
	}
}


export class PlayerHealth extends Health {
	readonly renderable: PIXI.extras.AnimatedSprite;

	constructor(def: HealthDef, actorID: symbol) {
		super(def, actorID);
		const texture = textures.cached('Spaceship.png');
		const frames: PIXI.Texture[] = [];
		const orig = new PIXI.Rectangle(0, 0, texture.width, texture.height);
		// Stack the frames in inverse order. Remember PIXI inverts the y-axis.
		for (let y = 0; y < 64; y += 32) {
			for (let x = 0; x < texture.width; x += 32) {
				frames.push(new PIXI.Texture(
					texture as any, new PIXI.Rectangle(x, y, 32, 32), orig));
			}
		}
		this.renderable = new PIXI.extras.AnimatedSprite(frames, false);
		this.renderable.anchor.set(0.5, 0.5);
	}

	subtract(hitpoints: number): void {
		super.subtract(hitpoints);
		this.renderable.gotoAndStop(this.max - this.hitpoints);
	}

	onAdd(actor: Actor): void {
		super.onAdd(actor);
		const pos = actor.cmp.phys.body.position;
		this.renderable.position.set(pos[0], pos[1]);
	}
}
