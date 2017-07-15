import {ModulatedOscillator} from './ModulatedOscillator';


export interface EngineOptions {
	readonly gain?: number;
	readonly states: EngineState[];
}


export interface EngineState {
	readonly time: number;
	readonly gain?: number;
	readonly frequency?: number;
	readonly modulationDepth?: number;
	readonly modulationFrequency?: number;
}


enum State {
	decelerating = -1,
	none = 0,
	accelerating = 1,
}


export const defaults: EngineOptions = {
	gain: 1,
	states: [],
}
for (let i = 0; i < 6; ++i) {
	defaults.states.push({
		time: 50 * i,
		frequency: 200 + i * 15,
		modulationDepth: 100 + i * 5,
		modulationFrequency: 5 + i,
	});
}


export class Engine {
	private readonly options: EngineOptions;
	private readonly source: ModulatedOscillator;
	private readonly gainNode: GainNode;
	private state: State = State.none;
	private timeoutID: number = 0;
	private step: number = 0;

	constructor(context: AudioContext, options?: EngineOptions) {
		this.options = Object.assign({}, defaults, options);
		if (!(this.options.states.length > 0)) {
			throw new Error("Invalid engine states");
		}
		this.source = new ModulatedOscillator(context, this.options.states[0]);
		this.gainNode = context.createGain();
		this.gainNode.gain.value = 0;
		this.source.connect(this.gainNode);
	}

	get gain(): AudioParam {
		return this.gainNode.gain;
	}

	accelerate(): void {
		if (this.state === State.accelerating) {
			return;
		}
		clearTimeout(this.timeoutID);
		this.state = State.accelerating;
		this.doAccelerate();
	}

	decelerate(): void {
		if (this.state === State.decelerating) {
			return;
		}
		clearTimeout(this.timeoutID);
		this.state = State.decelerating;
		this.doDecelerate();
	}

	steady(): void {
		if (this.timeoutID !== 0) {
			clearTimeout(this.timeoutID);
		}
		this.state = State.none;
	}

	start(): void {
		this.source.start();
	}

	stop(): void {
		this.source.stop();
	}

	connect<T extends AudioNode>(
		dest: T,
		outChannel?: number,
		inChannel?: number
	)
		: T
	{
		return this.gainNode.connect(dest, outChannel, inChannel) as T;
	}

	disconnect(): void {
		this.gainNode.disconnect();
	}

	private setState(state: EngineState): void {
		if (state.gain !== undefined) {
			this.gainNode.gain.value = state.gain;
		}
		if (state.frequency !== undefined) {
			this.source.frequency.value = state.frequency;
		}
		if (state.modulationDepth !== undefined) {
			this.source.modulationDepth.value = state.modulationDepth;
		}
		if (state.modulationFrequency !== undefined) {
			this.source.modulationFrequency.value = state.modulationFrequency;
		}
	}

	private doAccelerate(): void {
		if (this.step >= this.options.states.length) {
			return;
		}
		this.step = Math.max(0, this.step);
		const state = this.options.states[this.step];
		this.timeoutID = setTimeout((): void => {
			this.setState(state);
			++this.step;
			this.doAccelerate();
		}, state.time);
	}

	private doDecelerate(): void {
		if (this.step < 0) {
			return;
		}
		this.step = Math.min(this.step, this.options.states.length - 1);
		const state = this.options.states[this.step];
		this.setState(state);
		this.timeoutID = setTimeout((): void => {
			--this.step;
			this.doDecelerate();
		}, state.time);
	}
}
