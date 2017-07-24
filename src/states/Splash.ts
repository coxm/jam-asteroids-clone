import {State} from 'jam/states/State';

import * as states from 'game/states/index';
import {stages} from 'game/render';
import {textures} from 'game/load/index';


export class Splash extends State {
	private background: PIXI.Sprite | null = null;

	constructor(
		name: string,
		readonly texturePath: string,
		private readonly timeout?: number
	) {
		super(name);
	}

	protected doPreload(): Promise<PIXI.Texture> {
		return textures.texture(this.texturePath);
	}

	protected doInit(texture: PIXI.Texture): void {
		this.background = new PIXI.Sprite(texture);
		if (this.timeout !== undefined) {
			setTimeout((): void => {
				states.manager.trigger(states.Trigger.splashDone);
			}, this.timeout);
		}
	}

	protected doStart(texture: PIXI.Texture): void {
		stages.hud.addChild(this.background!);
	}

	protected doStop(): void {
		stages.hud.removeChild(this.background!);
	}
}
