export class AmmoCounter {
	readonly renderable: PIXI.Container;
	private readonly text: PIXI.Text;
	private readonly sprite: PIXI.Sprite;

	constructor(
		image: PIXI.Texture,
		padding: number,
		style: PIXI.TextStyleOptions,
		private count: number
	) {
		this.text = new PIXI.Text(count as any as string, style);
		this.sprite = new PIXI.Sprite(image);
		this.text.position.x = padding + this.sprite.width;
		this.renderable = new PIXI.Container();
		this.renderable.addChild(this.text);
		this.renderable.addChild(this.sprite);
	}

	get value(): number {
		return this.count;
	}
	set value(val: number) {
		this.count = val;
		this.text.text = val as any as string;
	}

	get width(): number {
		return this.text.width + this.sprite.width;
	}
	get height(): number {
		return this.text.height + this.sprite.height;
	}
}
