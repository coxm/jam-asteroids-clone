import * as events from 'game/events';

import {Engine} from './Engine';
import {Gun} from './Gun';


interface AudioNodeLike {
	connect(dest: AudioNode, chOut?: number, chIn?: number): AudioNode;
	disconnect(): void;
}


type AudioNodes = {
	readonly [key: string]: AudioNodeLike;
	readonly engine: Engine;
	readonly gun: Gun;
}


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
	private readonly nodes: Map<symbol, AudioNodes>;
	// private readonly merger: ChannelMergerNode;

	constructor(
		private readonly context: AudioContext,
		shipIDs: symbol[],
		options?: LevelAudioOptions
	) {
		options = Object.assign({}, options, defaults);

		const len: number = shipIDs.length;
		const numConnections: number = 2 * len + 1;
		const meanGain: number = 1 / numConnections;
		const engineGain = options!.engineGain * meanGain;
		const gunGain = options!.gunGain * meanGain;

		this.nodes = new Map();
		// this.merger = context.createChannelMerger(numConnections);

		for (let i = 0, engIn = 0; i < len; ++i, engIn += 2) {
			const engine = new Engine(context);
			engine.gain.value = engineGain;
			engine.start();
			engine.connect(context.destination);
			// engine.connect(this.merger, 0, engIn);

			const gun = new Gun(context, {maxGain: gunGain});
			// gun.connect(this.merger, 0, engIn + 1);
			gun.connect(context.destination);
			this.nodes.set(shipIDs[i], {engine, gun} as AudioNodes);
		}
	}

	attach(manager: events.Manager): void {
		manager.batch([
			[events.Category.engineStarted, this.onEngineStarted],
			[events.Category.engineStopped, this.onEngineStopped],
			[events.Category.gunFired, this.onGunFired],
		], {id: this.eventsID, context: this});
		for (let obj of this.nodes.values()) {
			for (let key in obj) {
				obj[key].connect(this.context.destination);
			}
		}
		// this.merger.connect(this.merger.context.destination);
	}

	detach(manager: events.Manager): void {
		manager.unbatch(this.eventsID);
		for (let obj of this.nodes.values()) {
			for (let key in obj) {
				obj[key].disconnect();
			}
		}
		// this.merger.disconnect();
	}

	onEngineStarted(ev: events.Event): void {
		const obj = this.nodes.get(ev.data.driver.actorID);
		if (obj) {
			obj.engine.accelerate();
		}
	}

	onEngineStopped(ev: events.Event): void {
		const obj = this.nodes.get(ev.data.driver.actorID);
		if (obj) {
			obj.engine.decelerate();
		}
	}

	onGunFired(ev: events.Event): void {
		const obj = this.nodes.get(ev.data.actorID);
		if (obj) {
			obj.gun.fire()
		}
	}
}
