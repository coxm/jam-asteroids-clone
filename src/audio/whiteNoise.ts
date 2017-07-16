export interface WhiteNoiseOptions {
	readonly numChannels?: number;
	readonly frameMult?: number;
	readonly rand?: () => number;
}


export const whiteNoiseSource = (
	context: AudioContext,
	options: WhiteNoiseOptions = {}
)
	: AudioBufferSourceNode =>
{
	// Options.
	const numChannels: number = options.numChannels || 2;
	const frameMult: number = options.frameMult || 2.0;
	const rand = options.rand || (() => Math.random() * 2 - 1);

	const frameCount: number = frameMult * context.sampleRate;
	const arrayBuffer = context.createBuffer(
		numChannels,
		frameCount,
		context.sampleRate
	);

	for (let channel = 0; channel < numChannels; ++channel) {
		const nowBuffering = arrayBuffer.getChannelData(channel);
		for (let i = 0; i < frameCount; ++i) {
			nowBuffering[i] = rand();
		}
	}

	const audioBufferSourceNode = context.createBufferSource();
	audioBufferSourceNode.buffer = arrayBuffer;
	return audioBufferSourceNode;
}
