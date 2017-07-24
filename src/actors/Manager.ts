import config from 'assets/config';

import {camera} from 'game/render';
import * as render from 'game/render';
import * as physics from 'game/physics';

import {Actor, ActorDef, factory} from './index';
import {InputDriver} from './components/InputDriver';
import {PlayerHealth} from './components/Health';


const {outerBorder, innerMargin} = config.render.viewport;


/**
 * Wrap an actor position within the camera's border.
 *
 * Ensures objects flying off the screen reappear on the opposite side.
 */
const wrapPosition = (pos: AnyVec2): void => {
	const xminHard = camera.xmin - outerBorder[0];
	const xmaxHard = camera.xmax + outerBorder[0];
	const yminHard = camera.ymin - outerBorder[1];
	const ymaxHard = camera.ymax + outerBorder[1];
	if (pos[0] < xminHard) {
		pos[0] = xmaxHard - innerMargin[0];
	}
	else if (pos[0] > xmaxHard) {
		pos[0] = xminHard + innerMargin[0];
	}
	if (pos[1] < yminHard) {
		pos[1] = ymaxHard - innerMargin[1];
	}
	else if (pos[1] > ymaxHard) {
		pos[1] = yminHard + innerMargin[1];
	}
}


/** Check if an actor is a player. */
export const isPlayer = (actor: Actor): boolean => !!actor.cmp.input;


/** Check if an actor is a projectile. */
export const isProjectile = (actor: Actor): boolean => !!actor.cmp.projectile;


/** Check if an actor is an asteroid. */
export const isAsteroid = (actor: Actor): boolean =>
	!isPlayer(actor) && !isProjectile(actor);


export interface ProjectileOptions {
	readonly position: AnyVec2;
	readonly offset: AnyVec2;
	readonly angle: number;
	readonly speed?: number;
}


export enum UpdateResult {
	failure,
	success,
	continue,
}


/** An object which manages all actors involved in the game. */
export class Manager {
	private readonly byID = new Map<symbol, Actor>();
	private readonly byAlias = new Map<string, Actor>();
	private readonly bodyOwners = new WeakMap<p2.Body, Actor>();
	private readonly players: Actor[] = [];
	private readonly toKill: symbol[] = [];
	private playerDied: boolean = false;

	/** Reset this actor manager. */
	deinit(): void {
		this.constructor.call(this);
	}

	update(): UpdateResult {
		for (let actor of this.byID.values()) {
			const cmp = actor.cmp;
			if (!cmp.phys) {
				continue;
			}
			const body = cmp.phys.body;
			const pos = body.position;
			if (!cmp.projectile) {  // Only projectiles get wrapped.
				wrapPosition(pos);
			}
			else if (!camera.inRange(pos[0], pos[1])) {
				this.queueDelete(actor.id);  // Remove spent projectiles.
			}
			cmp.anim.renderable.position.set(pos[0], pos[1]);
			cmp.anim.renderable.rotation = body.angle;
			cmp.driver && (cmp.driver as InputDriver).update &&
				(cmp.driver as InputDriver).update();

			const shield = (cmp.health as PlayerHealth).renderable;
			if (shield) {
				shield.position.set(pos[0], pos[1]);
				shield.rotation = body.angle;
			}
		}

		for (let i = 0, len = this.toKill.length; i < len; ++i) {
			this.doDelete(this.toKill[i]);
		}
		this.toKill.length = 0;

		if (this.playerDied) {
			return UpdateResult.failure;
		}

		// If any asteroids remain, continue.
		for (const actor of this.byID.values()) {
			if (isAsteroid(actor)) {
				return UpdateResult.continue;
			}
		}

		// If no asteroids remain and the players are alive, success!
		return UpdateResult.success;
	}

	/** Lookup an actor by ID or alias. */
	at(id: symbol | string): Actor {
		const actor = (typeof id === 'symbol'
			?	this.byID.get(id)
			:	this.byAlias.get(id)
		);
		if (!actor) {
			throw new Error("No such actor");
		}
		return actor;
	}

	/** Get the actor owning a body. */
	ownerOf(body: p2.Body): Actor | undefined {
		return this.bodyOwners.get(body);
	}

	create(def: ActorDef): Actor {
		this.ensureCanCreateMore();
		const actor: Actor = factory.actor(def);
		this.byID.set(actor.id, actor);
		if (actor.alias) {
			if (this.byAlias.has(actor.alias)) {
				throw new Error(`Actor '${actor.alias}' already exists`);
			}
			this.byAlias.set(actor.alias, actor);
		}

		// Add physics components to the physics simulation.
		const body = actor.cmp.phys.body;
		this.bodyOwners.set(body, actor);
		physics.world.addBody(body);

		// Add animated components to the stage.
		const anim = actor.cmp.anim;
		anim.renderable.position.set(body.position[0], body.position[1]);
		render.stages[anim.stage].addChild(anim.renderable);

		if (isPlayer(actor)) {
			this.players.push(actor);
			render.stages.lower.addChild(
				(actor.cmp.health as PlayerHealth).renderable);
		}
		return actor;
	}

	createProjectile(
		def: ActorDef,
		{position, offset, angle, speed}: ProjectileOptions
	)
		:	Actor
	{
		this.ensureCanCreateMore();
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const actor = factory.actor(def);
		if (actor.cmp.projectile && speed === undefined) {
			speed = actor.cmp.projectile.speed;
		}
		const body = actor.cmp.phys.body;
		p2.vec2.set(body.velocity, speed! * cos, speed! * sin);
		p2.vec2.set(
			body.position, 
			position[0] + offset[0] * cos,
			position[1] + offset[1] * sin
		);
		body.angle = angle;
		this.bodyOwners.set(body, actor);
		physics.world.addBody(body);

		// Prevent the shooter from colliding with its own projectiles for a
		// brief period after firing.
		const shape = body.shapes[0];
		const mask = shape.collisionMask;
		shape.collisionMask &= ~physics.CollisionGroup.players;
		setTimeout((): void => {
			shape.collisionMask = mask;
		}, 100);

		this.byID.set(actor.id, actor);
		return actor;
	}

	queueDelete(id: symbol): void {
		this.toKill.push(id);
	}

	createExplosion(
		projectileDef: ActorDef,
		position: AnyVec2,
		offset: AnyVec2,
		count: number,
		speed: number
	)
		: Actor[]
	{
		const tau = Math.PI * 2;
		const segment: number = tau / count;
		const start: number = Math.random() * tau;
		const end: number = start + tau;
		const actors: Actor[] = [];
		for (let angle = start; angle < end; angle += segment) {
			actors.push(this.createProjectile(projectileDef, {
				position, offset, angle, speed,
			}));
		}
		return actors;
	}

	createNotice(def: ActorDef, position: AnyVec2, duration: number)
		: void
	{
		const actor = factory.actor(def);
		const id = actor.id;
		this.byID.set(id, actor);
		const anim = actor.cmp.anim;
		render.stages.notices.addChild(anim.renderable);
		anim.renderable.position.set(position[0], position[1]);
		setTimeout((): void => {
			this.queueDelete(id);
		}, duration);
	}

	private doDelete(id: symbol): void {
		const actor = this.byID.get(id);
		if (!actor) {
			return;
		}
		const playerIndex = this.players.indexOf(actor);
		if (playerIndex >= 0) {
			this.players.splice(playerIndex, 1);
			this.playerDied = true;
			render.stages.lower.removeChild(
				(actor.cmp.health as PlayerHealth).renderable);
		}

		if (actor.cmp.phys) {
			physics.world.removeBody(actor.cmp.phys.body);
			this.bodyOwners.delete(actor.cmp.phys.body);
		}

		const anim = actor.cmp.anim;
		if (anim) {
			render.stages[anim.stage].removeChild(anim.renderable);
		}

		if (actor.alias) {
			this.byAlias.delete(actor.alias);
		}
		this.byID.delete(actor.id);

		actor.destroy();
	}

	private ensureCanCreateMore(): void {
		if (this.byID.size >= 50) {
			throw new Error("Actor limit reached");
		}
	}
}
