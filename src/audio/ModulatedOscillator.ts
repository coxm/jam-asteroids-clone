import {realOr} from 'jam/util/misc';


export interface ModulatedOscillatorOptions {
	readonly frequency?: number;
	readonly modulationDepth?: number;
	readonly modulationFrequency?: number;
}


/**
 * A modulated oscillator audio node.
 *
 * Based on the Wobbulator's ModulatedOscillator code:
 * {@see http://webaudio.prototyping.bbc.co.uk/wobbulator/}.
 */
export class ModulatedOscillator {
	private readonly oscillator: OscillatorNode;
	private readonly gainNode: GainNode;
	private readonly modulator: OscillatorNode;

	constructor(ctx: AudioContext, options: ModulatedOscillatorOptions = {}) {
		this.oscillator = ctx.createOscillator();
		this.gainNode = ctx.createGain();
		this.modulator = ctx.createOscillator();

		this.modulator.connect(this.gainNode);
		this.gainNode.connect(this.oscillator.frequency);

		this.frequency = realOr(options.frequency, 440);
		this.modulationDepth = realOr(options.modulationDepth, 100);
		this.modulationFrequency = realOr(options.modulationFrequency, 10);
	}

	get context(): AudioContext {
		return this.oscillator.context;
	}

	get numberOfInputs(): number {
		return 0;
	}

	get numberOfOutputs(): number {
		return this.oscillator.numberOfOutputs;
	}

	get channelCountMode(): ChannelCountMode {
		return 'explicit';
	}

	get channelCount(): number {
		return this.oscillator.channelCount;
	}

	get channelInterpretation(): ChannelInterpretation {
		return this.oscillator.channelInterpretation;
	}

	get frequency(): number {
		return this.oscillator.frequency.value;
	}
	set frequency(value: number) {
		this.oscillator.frequency.value = value;
	}

	get modulationDepth(): number {
		return this.gainNode.gain.value;
	}
	set modulationDepth(value: number) {
		this.gainNode.gain.value = value;
	}

	get modulationFrequency(): number {
		return this.modulator.frequency.value;
	}
	set modulationFrequency(value: number) {
		this.modulator.frequency.value = value;
	}

	start(): void {
		this.oscillator.start();
		this.modulator.start();
	}

	stop(): void {
		this.oscillator.stop();
		this.modulator.stop();
	}

	connect<T extends AudioNode>(
		dest: T,
		outChannel?: number,
		inChannel?: number
	)
		: T
	{
		return this.oscillator.connect(dest, outChannel, inChannel) as T;
	}

	disconnect(): void {
		this.oscillator.disconnect();
	}
}
