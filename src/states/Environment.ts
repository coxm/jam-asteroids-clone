import {State} from 'jam/states/State';

import config from 'assets/config';
import * as settings from 'game/settings';

import * as render from 'game/render';
import * as events from 'game/events';
import * as load from 'game/load/index';
import * as states from 'game/states/index';
import * as physics from 'game/physics';
import {Manager as AudioManager} from 'game/audio/Manager';
import {Manager as ActorManager, isPlayer} from 'game/actors/Manager';
import {Actor, ActorDef} from 'game/actors/index';


interface PreloadData {
	readonly actorDefs: {[key: string]: ActorDef;};
}


/**
 * A state which manages the entire gameplay session (i.e. not menus).
 *
 * Involves managing the physics, rendering, audio, and actors during gameplay.
 */
export class Environment extends State {
	private readonly actors = new ActorManager();
	private readonly actorDefs: {[key: string]: ActorDef;} = {};
	private readonly audio = new AudioManager(
		new AudioContext(), config.audio);
	private updateLoopID: number = 0;
	private readonly eventsBatchID: symbol;

	constructor(name: string) {
		super(name);
		this.eventsBatchID = Symbol(name);
	}

	// Update loop.
	private update(): void {
		physics.world.step(config.updateFrequencyHz);
		this.actors.update();
		if (this.actors.failed) {
			states.manager.trigger(states.Trigger.failure);
			return;
		}
	}

	// Preloading.
	protected async doPreload(): Promise<PreloadData> {
		await load.textures.textures(
			'Spaceship.png',
			'Asteroid.png',
			'Bullet.png'
		);
		const defNames: string[] = ['Bullet', ...settings.players];
		const defs: ActorDef[] = await Promise.all(
			defNames.map(name => load.actors.fromPartialDef({depends: name}))
		);
		const actorDefs: {[key: string]: ActorDef;} = {};
		for (let i = 0, len = defs.length; i < len; ++i) {
			actorDefs[defNames[i]] = defs[i];
		}
		return {actorDefs};
	}

	// Initialisation/de-initialisation.
	protected doInit(data: PreloadData): void {
		Object.assign(this.actorDefs, data.actorDefs);
		for (const alias of settings.players) {
			this.actors.create(this.actorDefs[alias]);
		}
		render.score.value = 0;
		this.audio.init(
			[...settings.players].map(alias => this.actors.at(alias).id)
		);
	}
	protected doDeinit(): void {
		physics.world.clear();
		this.actors.deinit();
	}

	// Pause/unpause.
	protected doPause(): void {
		clearInterval(this.updateLoopID);
		this.updateLoopID = 0;
	}
	protected doUnpause(): void {
		if (this.updateLoopID === 0) {
			this.updateLoopID = setInterval(
				(): void => this.update(),
				config.updateFrequencyHz * 1000
			);
		}
	}

	// Start/stop.
	protected doStart(): void {
		this.doUnpause();
		// Jump to the first child, but leave this state running.
		states.manager.trigger(states.Trigger.startChild);
	}
	protected doStop(): void {
		this.doPause();
	}

	// Attach/detach.
	protected doAttach(): void {
		events.manager.batch(
			this.getEventHandlers(),
			{id: this.eventsBatchID, context: this}
		);
		this.audio.attach(events.manager);
	}
	protected doDetach(): void {
		this.audio.detach(events.manager);
		events.manager.unbatch(this.eventsBatchID);
	}

	// Event handling.
	private getEventHandlers(): events.HandlerItem[] {
		return [
			[events.Category.sectorEntered, this.onSectorEntered],
			[events.Category.collision, this.onCollision],
			[events.Category.actorHasNoHealth, this.onActorHasNoHealth],
			[events.Category.gunFired, this.onGunFired],
		];
	}

	private onSectorEntered(ev: events.Event): void {
		for (let def of ev.data.actors) {
			this.actors.create(def);
		}
	}

	private onCollision(ev: events.Event): void {
		if (!ev.data.begin) {
			return;
		}

		const {a: {body: bodyA}, b: {body: bodyB}} = ev.data;
		const actorA = this.actors.ownerOf(bodyA)!;
		const actorB = this.actors.ownerOf(bodyB)!;
		actorA.cmp.health.subtract(1);
		actorB.cmp.health.subtract(1);

		const aIsProjectile: boolean = !!actorA.cmp.projectile;
		const bIsProjectile: boolean = !!actorB.cmp.projectile;
		if (aIsProjectile || bIsProjectile) {
			this.audio.onProjectileHit();
			if (isPlayer(actorA) || isPlayer(actorB)) {
				render.score.value -= 50;
			}
			else if (aIsProjectile !== bIsProjectile) {
				render.score.value += 10;
			}
		}
		else {
			this.audio.onCollision();
		}
	}

	private onActorHasNoHealth(ev: events.Event): void {
		this.actors.queueDelete(ev.data.actorID);
	}

	private onGunFired(ev: events.Event): void {
		this.audio.onGunFired(ev);
		const projectile: Actor = this.actors.createProjectile(
			this.actorDefs[ev.data.projectileName], ev.data);
		const body = projectile.cmp.phys.body;
		const renderable = projectile.cmp.anim.renderable;
		renderable.position.set(body.position[0], body.position[1]);
		render.stages.projectiles.addChild(renderable);
	}
}
