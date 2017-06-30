import {State} from 'jam/states/State';
import {
	ContactManager,
	NormalContactEvent,
	SensorContactEvent,
} from 'jam/physics/ContactManager';
import {Loop, loop} from 'jam/util/loop';

import * as render from 'game/render';
import * as actors from 'game/actors/index';
import * as load from 'game/load/index';
import * as events from 'game/events';


/** The data found in a level's JSON file. */
interface RawLevelJSON {
	readonly actors: actors.PartialActorDef[];
}


/** The data produced by a Level's preload step. */
export interface LevelPreloadData {
	readonly actors: actors.ActorDef[];
}


/** Update loop frequency: 30Hz. */
const UPDATE_LOOP_FREQUENCY_SECONDS: number = 1 / 30;


/** Borders used when wrapping asteroid/player positions. */
const OUTER_BORDER = [20, 20];
const INNER_MARGIN = [10, 10];


/**
 * Wrap an actor position within the camera's border.
 *
 * Ensures objects flying off the screen reappear on the opposite side.
 */
function wrapPosition(pos: Vec2): void {
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


export class Level extends State {
	private stage = new PIXI.Container();
	private actors: Map<symbol, actors.Actor>;
	private aliased = new Map<string, actors.Actor>();
	private bodyOwners = new WeakMap<p2.Body, actors.Actor>();
	private world: p2.World;
	private contacts: ContactManager;
	private updateLoop: Loop<undefined>;
	private eventsBatchID: symbol;

	constructor(name: string) {
		super(name);
		this.eventsBatchID = Symbol(this.name);
		const actors = this.actors = new Map();
		const world = this.world = new p2.World({
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
		this.contacts.install(this.world);
		this.updateLoop = loop({
			fn(msNow: number, msSinceLast: number): void {
				world.step(UPDATE_LOOP_FREQUENCY_SECONDS);
				for (let {cmp} of actors.values()) {
					const position = cmp.phys.body.position;
					wrapPosition(position);
					cmp.anim.renderable.position.set(position[0], position[1]);
					cmp.anim.renderable.rotation = cmp.phys.body.angle;
					cmp.driver && cmp.driver.update && cmp.driver.update();
				}
			},
			ms: UPDATE_LOOP_FREQUENCY_SECONDS * 1000,
		});
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
			'Asteroid.png'
		);
		const raw = await load.files.json<RawLevelJSON>(`levels/${this.name}`);
		const actorDefPromises = raw.actors.map(
			(partial: actors.PartialActorDef): Promise<actors.ActorDef> =>
				load.actors.fromPartialDef(partial)
		);
		const actors = await Promise.all(actorDefPromises);
		return {
			actors,
		};
	}

	protected doInit(data: LevelPreloadData): void {
		for (let def of data.actors) {
			const actor: actors.Actor = actors.factory.actor(def);
			this.actors.set(actor.id, actor);
			if (actor.alias) {
				if (this.aliased.has(actor.alias)) {
					throw new Error(`Actor '${actor.alias}' already exists`);
				}
				this.aliased.set(actor.alias, actor);
			}

			// Add physics components to the physics simulation.
			if (actor.cmp.phys) {
				this.world.addBody(actor.cmp.phys.body);
				this.bodyOwners.set(actor.cmp.phys.body, actor);
			}

			// Add animated components to the stage.
			if (actor.cmp.anim) {
				this.stage.addChild(actor.cmp.anim.renderable);
			}
		}
	}

	protected doDeinit(): void {
		this.stage.removeChildren();
		this.actors.clear();
		this.aliased.clear();
		this.world.clear();
	}

	protected doStart(): void {
		render.stage.addChild(this.stage);
		render.camera.moveTo(0, 0);
		this.updateLoop.start();
	}

	protected doStop(): void {
		render.stage.removeChild(this.stage);
		this.updateLoop.stop();
	}

	protected doPause(): void {
		this.updateLoop.stop();
	}

	protected doUnpause(): void {
		render.camera.moveTo(0, 0);
		this.updateLoop.start();
	}

	protected doAttach(): void {
		events.manager.batch(
			[
				[events.Category.physNormalContact, this.onPhysNormalContact],
				[events.Category.actorHasNoHealth, this.onActorHasNoHealth],
			],
			{
				id: this.eventsBatchID,
				context: this,
			}
		);
	}

	protected doDetach(): void {
		events.manager.unbatch(this.eventsBatchID);
	}

	private onPhysNormalContact(ev: events.Event): void {
		if (!ev.data.begin) {
			return;
		}

		this.bodyOwners.get(ev.data.a.body)!.cmp.health.subtract(1);
		this.bodyOwners.get(ev.data.b.body)!.cmp.health.subtract(1);
	}

	private onActorHasNoHealth(ev: events.Event): void {
		const actor = this.actorAt(ev.data.actorID);
		this.deleteActor(actor);
	}

	private deleteActor(actor: actors.Actor): void {
		if (actor.cmp.phys) {
			this.world.removeBody(actor.cmp.phys.body);
			this.bodyOwners.delete(actor.cmp.phys.body);
		}
		if (actor.cmp.anim) {
			this.stage.removeChild(actor.cmp.anim.renderable);
		}
		this.actors.delete(actor.id);
		if (actor.alias) {
			this.aliased.delete(actor.alias);
			if (actor.alias.startsWith('Player')) {
				events.manager.fire(events.Category.levelFailure, null);
			}
		}
	}
}
