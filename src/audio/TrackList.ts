function onTrackEnded(ev: Event): void {
	const parent = (ev.target as HTMLElement).parentElement!;
	const index = +(ev.target as HTMLAudioElement).dataset.next!;
	const next = parent.children[index] as HTMLAudioElement;
	if (next) {
		next.play();
		parent.dataset.current = index as any as string;
	}
}


export class TrackList {
	readonly container: HTMLElement;

	constructor(container: HTMLElement | string, loop?: boolean) {
		this.container = typeof container === 'string'
			?	document.getElementById(container)!
			:	container;
		if (!this.container) {
			throw new Error("Not an element: " + container);
		}
		const tracks = this.container.querySelectorAll('audio');
		if (tracks.length > 0) {
			this.reset(loop);
		}
	}

	reset(loop?: boolean): void {
		this.doReset(this.container.querySelectorAll('audio'), loop);
	}

	current(): HTMLAudioElement {
		const elem = this.container.querySelectorAll('audio')[
			+this.container.dataset.current!
		] as HTMLAudioElement;
		if (!elem) {
			throw new Error("No current track");
		}
		return elem;
	}

	play(): void {
		this.current().play();
	}

	pause(): void {
		this.current().pause();
	}

	private doReset(
		tracks: HTMLAudioElement[] | NodeListOf<HTMLAudioElement>,
		loop: boolean = true
	)
		: void
	{
		const last = tracks.length - 1;
		for (let i = 0; i < last;) {
			const track = tracks[i];
			track.dataset.next = ++i as any as string;
			track.onended = onTrackEnded;
		}
		if (loop) {
			tracks[last].dataset.next = 0 as any as string;
		}
		this.container.dataset.current = 0 as any as string;
	}
}
