import {Actor, ComponentDef, Component} from 'game/actors/index';


export interface InputDriverDef extends ComponentDef {
	readonly maxAngSpeed: number;
	readonly maxFwdThrust: number;
	readonly maxRevThrust: number;
}


const enum Move {
	up = 0x01,
	down = 0x02,
	left = 0x04,
	right = 0x08,
}


/** A component which responds to `KeyAction`s by moving its actor. */
export class InputDriver implements Component {
	key: string;

	private body: p2.Body | null = null;
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

	onAdd(actor: Actor): void {
		this.body = actor.cmp.phys.body;
	}

	onRemove(actor: Actor): void {
		this.body = null;
	}

	update(): void {
		this.force[0] = this.thrust * Math.cos(this.body!.angle);
		this.force[1] = this.thrust * Math.sin(this.body!.angle);
		this.body!.applyForce(this.force as any as number[]);
		this.body!.angularVelocity = this.angularVelocity;
	}

	up(): void {
		this.moveBits |= Move.up;
		this.thrust = this.maxFwdThrust;
	}

	stopUp(): void {
		this.moveBits &= ~Move.up;
		this.thrust = (this.moveBits & Move.down) ? this.maxRevThrust : 0;
	}

	down(): void {
		this.moveBits |= Move.down;
		this.thrust = this.maxRevThrust;
	}

	stopDown(): void {
		this.moveBits &= ~Move.down;
		this.thrust = (this.moveBits & Move.up) ? this.maxFwdThrust : 0;
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
}
