import {ComponentDef, ComponentBase} from 'game/actors/index';


export interface ProjectileDef extends ComponentDef {
	readonly speed: number;
	readonly damage: number;
}


export class Projectile extends ComponentBase {
	readonly speed: number;
	readonly damage: number;

	constructor(def: ProjectileDef, actorID: symbol) {
		super(actorID);
		this.speed = def.speed;
		this.damage = def.damage;
	}
}
