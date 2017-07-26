import config from 'assets/config';

import {Actor, ComponentDef, ComponentBase} from 'game/actors/index';


export interface AsteroidDriverDef extends ComponentDef {
	readonly angle?: number;
	readonly angularVelocity?: number;
	readonly velocity?: Vec2;
}


const randSign = (): number => Math.sign(0.5 - Math.random());
const randVelocityComponent = (): number =>
	randSign() * (
		config.asteroidSpeed.base +
		Math.random() * config.asteroidSpeed.variance
	);


/** A component which propels the actor in a fixed, random direction. */
export class AsteroidDriver extends ComponentBase {
	private readonly angle: number;
	private readonly angularVelocity: number;
	private readonly velocity: AnyVec2;

	constructor(def: AsteroidDriverDef, actorID: symbol) {
		super(actorID);
		this.angle = def.angle || 0;
		this.angularVelocity = def.angularVelocity || 0;
		this.velocity = p2.vec2.clone(def.velocity || [
			randVelocityComponent(),
			randVelocityComponent()
		]);
	}

	onAdd(actor: Actor): void {
		const body = actor.cmp.phys.body;
		body.angle = this.angle;
		body.angularVelocity = this.angularVelocity;
		p2.vec2.copy(body.velocity, this.velocity);
	}
}
