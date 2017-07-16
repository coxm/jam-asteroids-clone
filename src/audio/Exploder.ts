import {sleep} from 'jam/util/misc';

import {WhiteNoiseOptions, whiteNoiseSource} from './whiteNoise';


export interface ExplosionState {
	readonly time: number;
	readonly frequency?: number;
	readonly Q?: number;
	readonly gain?: number;
}


export interface ExploderOptions {
	readonly noise?: WhiteNoiseOptions;
	readonly states?: ExplosionState[];
}


export const defaults: ExploderOptions = {
	states: [
		{
			time: 0,
			frequency: 300,
			gain: 0,
		},
		{
			time: 0.001,
			frequency: 300,
			gain: 2,
		},
		{
			time: 0.2,
			frequency: 200,
			gain: 0.4,
		},
		{
			time: 0.4,
			frequency: 100,
			gain: 0,
		}
	],
}


export class Exploder {
	private readonly source: AudioBufferSourceNode;
	private readonly filter: BiquadFilterNode;
	private readonly gainNode: GainNode;
	private readonly options: ExploderOptions;

	constructor(context: AudioContext, options?: ExploderOptions) {
		this.options = options = Object.assign({}, defaults, options);
		this.gainNode = context.createGain();
		this.gainNode.gain.value = 0;

		this.filter = context.createBiquadFilter();
		this.filter.type = 'lowpass';

		this.source = whiteNoiseSource(context, this.options.noise!);
		this.source.loop = true;
		this.source.start();
		this.source.connect(this.filter).connect(this.gainNode);
	}

	get context(): AudioContext {
		return this.filter.context;
	}

	play(): Promise<void> {
		let time: number = this.context.currentTime;
		this.filter.frequency.cancelScheduledValues(time);
		this.filter.Q.cancelScheduledValues(time);
		this.gainNode.gain.cancelScheduledValues(time);
		for (let state of this.options.states!) {
			this.queueAt(time += state.time, state);
		}
		return sleep(time);
	}

	connect<T extends AudioNode>(
		node: T,
		outChannel?: number,
		inChannel?: number
	)
		: T
	{
		return this.gainNode.connect(node, outChannel, inChannel) as T;
	}

	disconnect(): void {
		this.gainNode.disconnect();
	}

	private queueAt(time: number, state: ExplosionState): void {
		if (state.gain !== undefined) {
			this.filter.gain.linearRampToValueAtTime(state.gain, time);
			this.gainNode.gain.linearRampToValueAtTime(state.gain, time);
		}
		if (state.frequency !== undefined) {
			this.filter.frequency.linearRampToValueAtTime(
				state.frequency, time);
		}
		if (state.Q !== undefined) {
			this.filter.Q.linearRampToValueAtTime(state.Q, time);
		}
	}
}
