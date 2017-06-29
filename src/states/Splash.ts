import {State} from 'jam/states/State';

import {stage} from 'game/render';
import {textures} from 'game/load/index';


export class Splash extends State {
	private background: PIXI.Sprite | null = null;

	constructor(name: string, readonly texturePath: string) {
		super(name);
	}

	protected doPreload(): Promise<PIXI.Texture> {
		return textures.texture(this.texturePath);
	}

	protected doInit(texture: PIXI.Texture): void {
		this.background = new PIXI.Sprite(texture);
	}

	protected doStart(texture: PIXI.Texture): void {
		stage.addChild(this.background!);
	}

	protected doStop(): void {
		stage.removeChild(this.background!);
	}
}
