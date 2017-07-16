import * as events from 'game/events';

import {Engine} from './Engine';
import {Laser, LaserOptions} from './Laser';
import {Exploder, ExploderOptions} from './Exploder';


export interface LevelAudioOptions {
	readonly gunGain: number;
	readonly engineGain: number;
	readonly collisions?: ExploderOptions;
	readonly laserHits?: LaserOptions;
}


export const defaults: LevelAudioOptions = {
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


export class LevelAudio {
	private readonly eventsID: symbol = Symbol('LevelAudio');
	private readonly merger: ChannelMergerNode;
	private readonly master: GainNode;
	private readonly cannons: Laser[];
	private readonly engines: Engine[];
	private readonly options: LevelAudioOptions;
	private readonly collisions: EffectPool;
	private readonly laserHits: EffectPool;

	constructor(
		context: AudioContext,
		private readonly shipIDs: symbol[],
		options?: LevelAudioOptions
	) {
		this.options = Object.assign({}, options, defaults);

		const numActors = shipIDs.length;
		const numAudioNodes = numActors * 2;
		this.cannons = [];
		this.engines = [];
		this.merger = context.createChannelMerger(numAudioNodes);
		for (let i = 0, input = 0; i < numActors; ++i) {
			const engine = new Engine(context);
			engine.gain.value = this.options.engineGain;
			engine.start();
			engine.connect(this.merger, 0, input++);
			this.engines.push(engine);

			const gun = new Laser(context, {maxGain: this.options.gunGain});
			gun.connect(this.merger, 0, input++);
			this.cannons.push(gun);
		}
		this.master = context.createGain();
		this.merger.connect(this.master).connect(context.destination);

		this.collisions = new EffectPool(
			() => new Exploder(context, this.options!.collisions!)
		);
		this.laserHits = new EffectPool(
			() => new Laser(context, this.options!.laserHits!)
		);
	}

	get context(): AudioContext {
		return this.master.context;
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
		this.master.gain.value = 0;
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
}
