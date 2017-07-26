export interface ScoreOptions {
	readonly position: AnyVec2;
	readonly anchor: AnyVec2;
}


export class Score {
	readonly display: PIXI.Text;

	constructor(
		options: ScoreOptions,
		style?: PIXI.TextStyleOptions,
		private val: number = 0
	) {
		this.display = new PIXI.Text(`Score: ${val}`, style);
		this.display.position.set(options.position[0], options.position[1]);
		this.display.anchor.set(options.anchor[0], options.anchor[1]);
	}

	get value(): number {
		return this.val;
	}
	set value(val: number) {
		if (this.val !== val) {
			this.val = val;
			this.display.text = 'Score: ' + val;
		}
	}
}
