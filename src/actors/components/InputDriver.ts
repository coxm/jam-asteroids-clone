import * as events from 'game/events';
import {Driver, Actor, ComponentDef, Component} from 'game/actors/index';
import {Gun} from './Gun';


export interface InputDriverDef extends ComponentDef {
	readonly maxAngSpeed: number;
	readonly maxFwdThrust: number;
	readonly maxRevThrust: number;
}


const enum Move {
	up = 0x01,
	down = 0x02,
	vertical = 0x03,

	left = 0x04,
	right = 0x08,
	turning = 0x12,
}


/**
 * A component which moves its actors with commands like `up()`, `down()`, etc.
 */
export class InputDriver implements Component, Driver {
	key: string;

	private body: p2.Body | null = null;
	private gun: Gun | null = null;
	private moveBits: number = 0;
	private angularVelocity: number = 0;
	private thrust: number = 0;
	private readonly force: Float32Array;
	private readonly maxAngSpeed: number;
	private readonly maxFwdThrust: number;
	private readonly maxRevThrust: number;

	constructor(def: InputDriverDef, readonly actorID: symbol) {
		this.force = p2.vec2.create();
		this.maxAngSpeed = def.maxAngSpeed || 0;
		this.maxFwdThrust = def.maxFwdThrust || 0;
		this.maxRevThrust = -def.maxRevThrust || 0;
	}

	isMoving(bits: Move): boolean {
		return !!(this.moveBits & bits);
	}

	onAdd(actor: Actor): void {
		this.body = actor.cmp.phys.body;
		this.gun = actor.cmp.gun;
	}

	onRemove(actor: Actor): void {
		this.body = null;
		this.gun = null;
	}

	update(): void {
		this.force[0] = this.thrust * Math.cos(this.body!.angle);
		this.force[1] = this.thrust * Math.sin(this.body!.angle);
		this.body!.applyForce(this.force as any as number[]);
		this.body!.angularVelocity = this.angularVelocity;
	}

	up(): void {
		if (!(this.moveBits & Move.vertical)) {
			events.manager.fire(events.Category.engineStarted, {driver: this});
		}
		this.moveBits |= Move.up;
		this.thrust = this.maxFwdThrust;
	}

	stopUp(): void {
		this.moveBits &= ~Move.up;
		this.thrust = (this.moveBits & Move.down) ? this.maxRevThrust : 0;
		if (!(this.moveBits & Move.vertical)) {
			events.manager.fire(events.Category.engineStopped, {driver: this});
		}
	}

	down(): void {
		if (!(this.moveBits & Move.vertical)) {
			events.manager.fire(events.Category.engineStarted, {driver: this});
		}
		this.moveBits |= Move.down;
		this.thrust = this.maxRevThrust;
	}

	stopDown(): void {
		this.moveBits &= ~Move.down;
		this.thrust = (this.moveBits & Move.up) ? this.maxFwdThrust : 0;
		if (!(this.moveBits & Move.vertical)) {
			events.manager.fire(events.Category.engineStopped, {driver: this});
		}
	}

	left(): void {
		this.moveBits |= Move.left;
		this.angularVelocity = -this.maxAngSpeed;
	}

	stopLeft(): void {
		this.moveBits &= ~Move.left;
		this.angularVelocity = (this.moveBits & Move.right)
			?	this.maxAngSpeed
			:	0;
	}

	right(): void {
		this.moveBits |= Move.right;
		this.angularVelocity = this.maxAngSpeed;
	}

	stopRight(): void {
		this.moveBits &= ~Move.right;
		this.angularVelocity = (this.moveBits & Move.left)
			?	-this.maxAngSpeed
			:	0;
	}

	shoot(): void {
		this.gun!.shoot();
	}
}
