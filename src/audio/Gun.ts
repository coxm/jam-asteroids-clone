export interface GunOptions {
	readonly maxGain: number;
	readonly intervals?: GunInterval[];
}


export interface GunInterval {
	time: number;
	gain?: number;
	detune?: number;
	frequency?: number;
}


export const defaults: GunOptions = {
	maxGain: 0.5,
	intervals: [
		{
			time: 0.01,
			frequency: 500,
			detune: 0,
			gain: 0.5,
		},
		{
			time: 0.05,
			frequency: 150,
			detune: 0,
			gain: 0.5,
		},
		{
			time: 0.150,
			gain: 0.5,
		}
	]
};


export class Gun {
	readonly options: GunOptions;

	private readonly oscillator: OscillatorNode;
	private readonly gainNode: GainNode;

	constructor(context: AudioContext, options?: GunOptions) {
		this.options = Object.assign({}, defaults, options);
		this.oscillator = context.createOscillator();
		this.gainNode = context.createGain();
		this.oscillator.connect(this.gainNode);
		this.gainNode.gain.value = 0;
		this.oscillator.start();
	}

	fire(): void {
		const now = this.oscillator.context.currentTime;
		this.oscillator.detune.cancelScheduledValues(now);
		this.oscillator.frequency.cancelScheduledValues(now);
		this.gainNode.gain.cancelScheduledValues(now);
		let time: number = this.gainNode.context.currentTime;
		for (const interval of this.options.intervals!) {
			this.queueAt(time += interval.time, interval);
		}
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

	private queueAt(time: number, interval: GunInterval): void {
		if (interval.detune !== undefined) {
			this.oscillator.detune.linearRampToValueAtTime(
				interval.detune, time);
		}
		if (interval.frequency !== undefined) {
			this.oscillator.frequency.linearRampToValueAtTime(
				interval.frequency, time);
		}
		if (interval.gain !== undefined) {
			this.gainNode.gain.linearRampToValueAtTime(interval.gain, time);
		}
	}
}
