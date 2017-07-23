import * as events from 'game/events';

import {Engine} from './Engine';
import {Laser, LaserOptions} from './Laser';
import {Exploder, ExploderOptions} from './Exploder';


export interface ManagerOptions {
	readonly master?: number;
	readonly gunGain: number;
	readonly engineGain: number;
	readonly collisions?: ExploderOptions;
	readonly laserHits?: LaserOptions;
	readonly shipIDs?: symbol[];
}


export const defaults: ManagerOptions = {
	gunGain: 0.2,
	engineGain: 0.3,
};


interface Effect {
	play(): Promise<void>;
	connect(node: AudioNode, outCh?: number, inCh?: number): void;
	disconnect(): void;
}


class EffectPool {
	private readonly list: Effect[] = [];

	constructor(private readonly create: () => Effect) {
	}

	play(dest: AudioNode): void {
		const effect = this.list.pop() || this.create();
		effect.connect(dest);
		effect.play().then((): void => {
			effect!.disconnect();
			this.list.push(effect);
		});
	}
}


export class Manager {
	private readonly eventsID: symbol = Symbol('Manager');
	private merger: ChannelMergerNode | null = null;
	private readonly master: GainNode;
	private cannons: Laser[] = [];
	private engines: Engine[] = [];
	private shipIDs: symbol[];
	private readonly options: ManagerOptions;
	private readonly collisions: EffectPool;
	private readonly laserHits: EffectPool;

	constructor(context: AudioContext, options?: ManagerOptions) {
		this.options = Object.assign({}, options, defaults);
		this.master = context.createGain();
		if (typeof options!.master === 'number') {
			if (0 === (this.master.gain.value = options!.master!)) {
				console.warn('Master volume set to zero');
			}
		}
		this.collisions = new EffectPool(
			() => new Exploder(context, this.options!.collisions!)
		);
		this.laserHits = new EffectPool(
			() => new Laser(context, this.options!.laserHits!)
		);
		if (this.options.shipIDs) {
			this.doReset(this.options.shipIDs);
		}
		else {
			this.shipIDs = [];
		}
	}

	get context(): AudioContext {
		return this.master.context;
	}

	init(shipIDs: symbol[]): void {
		this.master.disconnect();
		if (this.merger) {
			this.merger.disconnect();
		}
		this.doReset(shipIDs);
	}

	attach(manager: events.Manager): void {
		manager.batch([
			[events.Category.engineStarted, this.onEngineStarted],
			[events.Category.engineStopped, this.onEngineStopped],
			[events.Category.gunFired, this.onGunFired],
		], {id: this.eventsID, context: this});
		this.master.connect(this.master.context.destination);
		this.master.gain.linearRampToValueAtTime(1, 0.5);
	}

	detach(manager: events.Manager): void {
		manager.unbatch(this.eventsID);
		this.master.gain.linearRampToValueAtTime(0, 0.1);
		this.master.disconnect();
	}

	onEngineStarted(ev: events.Event): void {
		const index = this.shipIDs.indexOf(ev.data.driver.actorID);
		if (index >= 0) {
			this.engines[index].accelerate();
		}
	}

	onEngineStopped(ev: events.Event): void {
		const index = this.shipIDs.indexOf(ev.data.driver.actorID);
		if (index >= 0) {
			this.engines[index].decelerate();
		}
	}

	onGunFired(ev: events.Event): void {
		const index = this.shipIDs.indexOf(ev.data.actorID);
		if (index >= 0) {
			this.cannons[index].play()
		}
	}

	onCollision(): void {
		this.collisions.play(this.master);
	}

	onProjectileHit(): void {
		this.laserHits.play(this.master);
	}

	private doReset(shipIDs: symbol[]): void {
		const numActors = shipIDs.length;
		const numAudioNodes = numActors * 2;
		const context = this.context;
		const merger = context.createChannelMerger(Math.max(numAudioNodes, 1));
		const cannons: Laser[] = [];
		const engines: Engine[] = [];
		for (let i = 0, input = 0; i < numActors; ++i) {
			const engine = new Engine(context);
			engine.gain.value = this.options.engineGain;
			engine.start();
			engine.connect(merger, 0, input++);
			engines.push(engine);

			const gun = new Laser(context, {maxGain: this.options.gunGain});
			gun.connect(merger, 0, input++);
			cannons.push(gun);
		}

		if (this.merger) {
			this.merger.disconnect();
		}
		this.merger = merger;
		this.merger.connect(this.master);
		this.shipIDs = shipIDs;
		this.cannons = cannons;
		this.engines = engines;
	}
}
