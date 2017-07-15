import * as events from 'game/events';

import {Engine} from './Engine';
import {Gun} from './Gun';


export interface LevelAudioOptions {
	readonly gunGain: number;
	readonly engineGain: number;
}


export const defaults: LevelAudioOptions = {
	gunGain: 0.2,
	engineGain: 0.3,
};


export class LevelAudio {
	private readonly eventsID: symbol = Symbol('LevelAudio');
	private readonly merger: ChannelMergerNode;
	private readonly master: GainNode;
	private readonly guns: Gun[];
	private readonly engines: Engine[];

	constructor(
		context: AudioContext,
		private readonly shipIDs: symbol[],
		options?: LevelAudioOptions
	) {
		Object.assign(window, {levelAudio: this});
		options = Object.assign({}, options, defaults);

		const numActors = shipIDs.length;
		const numAudioNodes = numActors * 2;
		this.guns = [];
		this.engines = [];
		this.merger = context.createChannelMerger(numAudioNodes);
		for (let i = 0, input = 0; i < numActors; ++i) {
			const engine = new Engine(context);
			engine.gain.value = 0.2;
			engine.start();
			engine.connect(this.merger, 0, input++);
			this.engines.push(engine);

			const gun = new Gun(context, {maxGain: 0.4});
			gun.connect(this.merger, 0, input++);
			this.guns.push(gun);
		}
		this.master = context.createGain();
		this.merger.connect(this.master).connect(context.destination);
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
			this.guns[index].fire()
		}
	}
}
