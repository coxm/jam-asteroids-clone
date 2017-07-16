import {State} from 'jam/states/State';
import {
	ContactManager,
	NormalContactEvent,
	SensorContactEvent,
} from 'jam/physics/ContactManager';

import * as render from 'game/render';
import * as load from 'game/load/index';
import * as events from 'game/events';
import * as actors from 'game/actors/index';
import {context as audioContext} from 'game/audio/index';
import {InputDriver} from 'game/actors/components/InputDriver';
import {CollisionGroup} from 'game/physics';
import {LevelAudio, LevelAudioOptions} from 'game/audio/LevelAudio';


/** The data found in a level's JSON file. */
interface RawLevelJSON {
	readonly title: string;
	readonly actors: actors.PartialActorDef[];
}


/** The data produced by a Level's preload step. */
export interface LevelPreloadData {
	readonly title: string;
	readonly initialActors: actors.ActorDef[];
	readonly dynamicActors: {[key: string]: actors.ActorDef;};
	readonly audio: LevelAudioOptions;
}


/** Update loop frequency: 30Hz. */
const UPDATE_FREQ_HZ: number = 1 / 30;


/** Borders used when wrapping asteroid/player positions. */
const OUTER_BORDER = [20, 20];
const INNER_MARGIN = [10, 10];


/**
 * Wrap an actor position within the camera's border.
 *
 * Ensures objects flying off the screen reappear on the opposite side.
 */
function wrapPosition(pos: AnyVec2): void {
	const xminHard = render.camera.xmin - OUTER_BORDER[0];
	const xmaxHard = render.camera.xmax + OUTER_BORDER[0];
	const yminHard = render.camera.ymin - OUTER_BORDER[1];
	const ymaxHard = render.camera.ymax + OUTER_BORDER[1];
	if (pos[0] < xminHard) {
		pos[0] = xmaxHard - INNER_MARGIN[0];
	}
	else if (pos[0] > xmaxHard) {
		pos[0] = xminHard + INNER_MARGIN[0];
	}
	if (pos[1] < yminHard) {
		pos[1] = ymaxHard - INNER_MARGIN[1];
	}
	else if (pos[1] > ymaxHard) {
		pos[1] = yminHard + INNER_MARGIN[1];
	}
}


/** Expand a partial actor definition into a full one. */
const expandActorDef =
	(partial: actors.PartialActorDef): Promise<actors.ActorDef> =>
		load.actors.fromPartialDef(partial);


/** Check if an actor is a player. */
const isPlayer = (actor: actors.Actor): boolean => !!actor.cmp.input;


export class Level extends State {
	private title: string = '';
	private stages: {
		readonly [key: string]: PIXI.Container;
		readonly projectiles: PIXI.Container;
		readonly main: PIXI.Container;
		readonly hud: PIXI.Container;
	};
	private score: {display: PIXI.Text; value: number; changed: boolean;};
	private actors: Map<symbol, actors.Actor>;
	private aliased = new Map<string, actors.Actor>();
	private bodyOwners = new WeakMap<p2.Body, actors.Actor>();
	private world: p2.World;
	private contacts: ContactManager;
	private updateLoopID: number = 0;
	private eventsBatchID: symbol;
	private dynamicActorDefs: {[key: string]: actors.ActorDef;} = {};
	private failed: boolean = false;
	private readonly players: actors.Actor[] = [];

	private audio: LevelAudio | null = null;

	constructor(name: string) {
		super(name);
		this.eventsBatchID = Symbol(this.name);
		this.actors = new Map();
		this.world = new p2.World({
			gravity: [0, 0],
		});
		this.contacts = new ContactManager({
			onNormalContact(ev: NormalContactEvent): void {
				events.manager.fire(events.Category.physNormalContact, ev);
			},
			onSensorContact(ev: SensorContactEvent): void {
				// Nothing to do here.
			}
		});

		this.score = {
			display: new PIXI.Text('Score: 0'),
			value: 0,
			changed: false,
		};

		this.stages = {
			projectiles: new PIXI.Container(),
			main: new PIXI.Container(),
			hud: new PIXI.Container(),
		};
	}

	/** Lookup an actor by ID or alias. */
	actorAt(id: symbol | string): actors.Actor {
		const actor = (typeof id === 'symbol'
			?	this.actors.get(id)
			:	this.aliased.get(id)
		);
		if (!actor) {
			throw new Error("No such actor");
		}
		return actor;
	}

	protected async doPreload(): Promise<LevelPreloadData> {
		await load.textures.textures(
			'Spaceship.png',
			'Asteroid.png',
			'Bullet.png'
		);
		const raw = await load.files.json<RawLevelJSON>(`levels/${this.name}`);
		const audio = await load.files.json<LevelAudioOptions>('config/audio');
		return {
			title: raw.title,
			initialActors: await Promise.all(raw.actors.map(expandActorDef)),
			dynamicActors: {
				Bullet: await expandActorDef({depends: 'Bullet'}),
			},
			audio: audio,
		};
	}

	protected doInit(data: LevelPreloadData): void {
		this.score.display.position.set(180, 200);
		this.stages.hud.addChild(this.score.display);
		this.contacts.install(this.world);
		this.title = data.title;
		Object.assign(this.dynamicActorDefs, data.dynamicActors);
		for (let def of data.initialActors) {
			this.createActor(def);
		}
		this.audio = new LevelAudio(
			audioContext,
			this.players.map(player => player.id),
			data.audio
		);
	}

	protected doDeinit(): void {
		for (let key in this.stages) {
			this.stages[key].removeChildren();
		}
		for (let actor of this.actors.values()) {
			this.deleteActor(actor);
		}
		this.actors.clear();
		this.aliased.clear();
		this.contacts.uninstall();
		this.world.clear();
		this.players.length = 0;
	}

	protected doStart(): void {
		this.failed = false;
		render.stage.addChild(this.stages.projectiles);
		render.stage.addChild(this.stages.main);
		render.stage.addChild(this.stages.hud);
		this.doUnpause();
	}

	protected doStop(): void {
		render.stage.removeChild(this.stages.projectiles);
		render.stage.removeChild(this.stages.main);
		render.stage.removeChild(this.stages.hud);
		this.doPause();
	}

	protected doPause(): void {
		clearInterval(this.updateLoopID);
		this.updateLoopID = 0;
	}

	protected doUnpause(): void {
		render.camera.moveTo(0, 0);
		if (this.updateLoopID === 0) {
			this.updateLoopID = setInterval((): void => {
				this.update();
			}, UPDATE_FREQ_HZ * 1000);
		}
	}

	protected doAttach(): void {
		events.manager.batch(
			[
				[events.Category.physNormalContact, this.onPhysNormalContact],
				[events.Category.actorHasNoHealth, this.onActorHasNoHealth],
				[events.Category.gunFired, this.onGunFired],
			],
			{
				id: this.eventsBatchID,
				context: this,
			}
		);
		this.audio!.attach(events.manager);
	}

	protected doDetach(): void {
		events.manager.unbatch(this.eventsBatchID);
		this.audio!.detach(events.manager);
	}

	private update(): void {
		if (this.failed) {
			this.pause();
			events.manager.fire(events.Category.levelFailure, null);
			return;
		}

		this.world.step(UPDATE_FREQ_HZ);
		const toKill: actors.Actor[] = [];
		for (let actor of this.actors.values()) {
			const cmp = actor.cmp;
			const pos = cmp.phys.body.position;
			if (!cmp.projectile) {
				wrapPosition(pos);
			}
			else if (!render.camera.inRange(pos[0], pos[1])) {
				toKill.push(actor);
				continue;
			}
			cmp.anim.renderable.position.set(pos[0], pos[1]);
			cmp.anim.renderable.rotation = cmp.phys.body.angle;
			(
				cmp.driver &&
				(cmp.driver as InputDriver).update &&
				(cmp.driver as InputDriver).update()
			);
		}

		for (let actor of toKill) {
			this.deleteActor(actor);
		}

		if (this.score.changed) {
			this.score.display.text = `Score: ${this.score.value}`;
			this.score.changed = false;
		}
	}

	private onPhysNormalContact(ev: events.Event): void {
		if (!ev.data.begin) {
			return;
		}

		const {a: {body: bodyA}, b: {body: bodyB}} = ev.data;
		const actorA = this.bodyOwners.get(bodyA)!;
		const actorB = this.bodyOwners.get(bodyB)!;
		actorA.cmp.health.subtract(1);
		actorB.cmp.health.subtract(1);

		const aIsProjectile: boolean = !!actorA.cmp.projectile;
		const bIsProjectile: boolean = !!actorB.cmp.projectile;
		if (aIsProjectile || bIsProjectile) {
			this.audio!.onProjectileHit();
			if (aIsProjectile !== bIsProjectile) {
				this.score.changed = true;
				this.score.value += 10;
			}
		}
		else {
			this.audio!.onCollision();
		}
	}

	private onActorHasNoHealth(ev: events.Event): void {
		const actor = this.actorAt(ev.data.actorID);
		this.deleteActor(actor);
	}

	private onGunFired(ev: events.Event): void {
		const {projectileName, position, offset, angle} = (ev.data as {
			projectileName: string;
			position: AnyVec2;
			offset: AnyVec2;
			angle: number;
		});
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const actorDef = this.dynamicActorDefs[projectileName];
		const actor = this.createActor(
			Object.assign({}, actorDef, {
				position: [
					position[0] + offset[0] * cos,
					position[1] + offset[1] * sin,
				],
			})
		);
		const speed = actor.cmp.projectile.speed;
		const body = actor.cmp.phys.body;
		p2.vec2.set(body.velocity, speed * cos, speed * sin);
		body.angle = angle;
		this.bodyOwners.set(body, actor);

		// Prevent the shooter from colliding with its own projectiles for a
		// brief period after firing.
		const shape = body.shapes[0];
		const mask = shape.collisionMask;
		shape.collisionMask &= ~CollisionGroup.players;
		setTimeout((): void => {
			shape.collisionMask = mask;
		}, 100);
	}

	private createActor(def: actors.ActorDef): actors.Actor {
		const actor: actors.Actor = actors.factory.actor(def);
		this.actors.set(actor.id, actor);
		if (actor.alias) {
			if (this.aliased.has(actor.alias)) {
				throw new Error(`Actor '${actor.alias}' already exists`);
			}
			this.aliased.set(actor.alias, actor);
		}

		// Add physics components to the physics simulation.
		const body = actor.cmp.phys.body;
		this.world.addBody(body);
		this.bodyOwners.set(body, actor);

		// Add animated components to the stage.
		actor.cmp.anim.renderable.position.set(
			body.position[0], body.position[1]);
		(actor.cmp.projectile
			?	this.stages.projectiles
			:	this.stages.main
		).addChild(actor.cmp.anim.renderable);

		if (isPlayer(actor)) {
			this.players.push(actor);
		}
		return actor;
	}

	private deleteActor(actor: actors.Actor): void {
		if (actor.cmp.phys) {
			this.world.removeBody(actor.cmp.phys.body);
			this.bodyOwners.delete(actor.cmp.phys.body);
		}

		if (actor.cmp.projectile) {
			this.stages.projectiles.removeChild(actor.cmp.anim.renderable);
		}
		else if (actor.cmp.anim) {
			this.stages.main.removeChild(actor.cmp.anim.renderable);
		}

		this.actors.delete(actor.id);
		if (actor.alias) {
			this.aliased.delete(actor.alias);
			if (actor.alias.startsWith('Player')) {
				// Mark failed so we can complete this update cycle before
				// clearing the level.
				this.failed = true;
			}
		}

		const playerIndex = this.players.indexOf(actor);
		if (playerIndex >= 0) {
			this.players.splice(playerIndex, 1);
		}
		actor.destroy();
	}
}
