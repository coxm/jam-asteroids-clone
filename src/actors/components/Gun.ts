import {Actor, ComponentDef, Component} from 'game/actors/index';
import * as events from 'game/events';


export interface GunDef extends ComponentDef {
	readonly offset: AnyVec2;
	readonly reloadTime: number;
	readonly projectileName: string;
}


export class Gun implements Component {
	key: string;

	private readonly offset: AnyVec2;
	private readonly reloadTime: number;
	private readonly projectileName: string;
	private lastShotTime: number = 0;
	private body: p2.Body | null = null;

	constructor(def: GunDef, readonly actorID: symbol) {
		this.offset = def.offset;
		this.reloadTime = def.reloadTime;
		this.projectileName = def.projectileName;
	}

	onAdd(actor: Actor): void {
		this.body = actor.cmp.phys.body;
	}

	onRemove(actor: Actor): void {
		this.body = null;
	}

	shoot(): void {
		const now = Date.now();
		if (now - this.lastShotTime > this.reloadTime) {
			this.lastShotTime = now;
			events.manager.fire(events.Category.gunFired, {
				actorID: this.actorID,
				position: this.body!.position,
				offset: this.offset,
				angle: this.body!.angle,
				projectileName: this.projectileName,
			});
		}
	}
}
