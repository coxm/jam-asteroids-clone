import * as events from 'game/events';

import {Engine} from './Engine';


export class LevelAudio {
	private readonly eventsID: symbol = Symbol('LevelAudio');
	private readonly engines: Map<symbol, Engine>;
	private readonly meanGain: number = 0;

	constructor(private readonly context: AudioContext, shipIDs: symbol[]) {
		this.engines = new Map();
		const len: number = shipIDs.length;
		const numNodes: number = 2 * len + 1;
		this.meanGain = 1 / numNodes;
		for (let i = 0; i < len; ++i) {
			const engine = new Engine(context);
			engine.gain.value = this.meanGain;
			engine.start();
			this.engines.set(shipIDs[i], engine);
		}
	}

	attach(manager: events.Manager): void {
		manager.batch([
			[events.Category.engineStarted, this.onEngineStarted],
			[events.Category.engineStopped, this.onEngineStopped]
		], {id: this.eventsID, context: this});
		for (let engine of this.engines.values()) {
			engine.connect(this.context.destination);
		}
	}

	detach(manager: events.Manager): void {
		manager.unbatch(this.eventsID);
		for (let engine of this.engines.values()) {
			engine.disconnect();
		}
	}

	onEngineStarted(ev: events.Event): void {
		const engine = this.engines.get(ev.data.driver.actorID);
		if (engine) {
			engine.accelerate();
		}
	}

	onEngineStopped(ev: events.Event): void {
		const engine = this.engines.get(ev.data.driver.actorID);
		if (engine) {
			engine.decelerate();
		}
	}
}
