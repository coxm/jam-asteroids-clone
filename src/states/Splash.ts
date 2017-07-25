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
		private readonly timeout?: number
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
		if (this.timeout !== undefined) {
			console.log('Setting timeout for', this.name, this.timeout);
			this.timeoutID = setTimeout((): void => {
				console.log('Splash', this.name, 'timed out');
				states.manager.trigger(states.Trigger.splashDone);
			}, this.timeout);
		}
	}

	protected doStop(): void {
		stages.hud.removeChild(this.background!);
		clearTimeout(this.timeoutID);
		this.timeoutID = 0;
	}
}
