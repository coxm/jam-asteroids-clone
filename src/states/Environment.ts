import {State} from 'jam/states/State';

import config from 'assets/config';
import * as settings from 'game/settings';

import * as render from 'game/render/index';
import * as events from 'game/events';
import * as load from 'game/load/index';
import * as physics from 'game/physics';
import {Manager as AudioManager} from 'game/audio/Manager';
import {
	Manager as ActorManager,
	isPlayer,
	isAsteroid,
	UpdateResult
} from 'game/actors/Manager';
import {Actor, ActorDef} from 'game/actors/index';

import * as states from './index';
import {Sector, SectorPreloadData} from './Sector';


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
	private updateLoopID: number = 0;
	private readonly eventsBatchID: symbol;
	private sector: Sector | null = null;

	constructor(name: string, private readonly audio: AudioManager) {
		super(name);
		this.eventsBatchID = Symbol(name);
	}

	async enterSector(sector: Sector): Promise<void> {
		this.sector = null;
		const preloadData: SectorPreloadData = await sector.preload();
		for (const def of preloadData.actors) {
			this.actors.create(def);
		}
		this.sector = sector;
		return sector.start();
	}

	leaveCurrentSector(): void {
		this.sector = null;
	}

	// Update loop.
	private update(): void {
		physics.world.step(config.updateFrequencyHz);
		const result = this.actors.update();
		if (result === UpdateResult.failure) {
			this.stop();
			states.manager.trigger(states.Trigger.playerDied);
		}
		else if (result === UpdateResult.success && this.sector !== null) {
			states.manager.trigger(states.Trigger.sectorComplete);
		}
	}

	// Preloading.
	protected async doPreload(): Promise<PreloadData> {
		await load.textures.textures(...config.render.textures);
		const defNames: string[] = [...config.actorDefs, ...settings.players];
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
		this.actors.deinit();
		this.updateLoopID = 0;
		this.sector = null;
	}

	// Pause/unpause.
	protected doStart(): void {
		if (this.updateLoopID === 0) {
			this.updateLoopID = setInterval(
				(): void => this.update(),
				config.updateFrequencyHz * 1000
			);
		}
	}
	protected doStop(): void {
		clearInterval(this.updateLoopID);
		this.updateLoopID = 0;
		render.reset();
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
			[events.Category.collision, this.onCollision],
			[events.Category.actorHasNoHealth, this.onActorHasNoHealth],
			[events.Category.gunFired, this.onGunFired],
		];
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
		if (!(aIsProjectile || bIsProjectile)) {
			this.audio.onCollision();
		}

		this.audio.onProjectileHit();
		if (aIsProjectile && bIsProjectile) {
			return;
		}

		if (isPlayer(actorA) || isPlayer(actorB)) {
			render.score.value -= 50;
		}
		else if (aIsProjectile !== bIsProjectile) {
			render.score.value += 10;
		}
	}

	private onActorHasNoHealth(ev: events.Event): void {
		this.actors.queueDelete(ev.data.actorID);
		const actor = this.actors.at(ev.data.actorID);
		if (actor.cmp.exploder) {
			const {debris, offset, count, speed, stage} =
				actor.cmp.exploder.def;
			const actors: Actor[] = this.actors.createExplosion(
				this.actorDefs[debris], actor.cmp.phys.body.position,
				offset, count, speed);
			for (let actor of actors) {
				this.addActorToStage(actor, render.stages[stage]);
			}
		}
		else if (isAsteroid(actor)) {  // Small asteroids only (no exploder).
			this.actors.createNotice(
				this.actorDefs.MoreAmmoNotice,
				actor.cmp.phys.body.position,
				config.noticeDuration
			);
			const bonus: number = Math.floor(
				config.smallAsteroidAmmoBonus / settings.players.size);
			for (let [actorID, counter] of render.ammo.counters) {
				counter.value = this.actors.at(actorID).cmp.gun.addAmmo(bonus);
			}
		}
	}

	private onGunFired(ev: events.Event): void {
		this.audio.onGunFired(ev);
		const projectile: Actor = this.actors.createProjectile(
			this.actorDefs[ev.data.projectileName], ev.data);
		this.addActorToStage(projectile, render.stages.lower);
		--render.ammo.at(ev.data.actorID).value;
	}

	private addActorToStage(actor: Actor, stage: PIXI.Container): void {
		const body = actor.cmp.phys.body;
		const renderable = actor.cmp.anim.renderable;
		renderable.position.set(body.position[0], body.position[1]);
		stage.addChild(renderable);
	}
}
