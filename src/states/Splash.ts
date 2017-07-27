import {State} from 'jam/states/State';

import * as states from 'game/states/index';
import {stages} from 'game/render/index';
import {textures} from 'game/load/index';


export class Splash extends State {
	private background: PIXI.Sprite | null = null;
	private timeoutID: number = 0;

	constructor(
		name: string,
		readonly texturePath: string,
		private readonly timeout: number = 0
	) {
		super(name);
	}

	protected doPreload(): Promise<PIXI.Texture> {
		return textures.texture(this.texturePath);
	}

	protected doInit(texture: PIXI.Texture): void {
		this.background = new PIXI.Sprite(texture);
	}

	protected doStart(texture: PIXI.Texture): void {
		stages.hud.addChild(this.background!);
		if (this.timeout) {
			this.timeoutID = setTimeout((): void => {
				states.manager.trigger(states.Trigger.splashDone);
			}, this.timeout) as any as number;
		}
	}

	protected doStop(): void {
		stages.hud.removeChild(this.background!);
		clearTimeout(this.timeoutID);
		this.timeoutID = 0;
	}
}
