import {Camera} from 'jam/render/Camera';
import {loop as renderLoop, RenderLoop} from 'jam/render/loop';
export {RenderLoop} from 'jam/render/loop';

import config from 'assets/config';

import {textures} from 'game/load/index';

import {AmmoCounter} from './AmmoCounter';
import {Score} from './Score';


export type Renderer = PIXI.CanvasRenderer | PIXI.WebGLRenderer;


export const viewportWidth = 640;
export const viewportHeight = 480;

export const renderer: Renderer = PIXI.autoDetectRenderer(
	viewportWidth,
	viewportHeight,
	{
		antialias: true,
	}
);


/**
 * The render stage tree.
 *
 * rootStage
 *  |-- background (not focused by the camera; used for background images)
 *  |-- space (contains most stuff in the game; gets manipulated by the camera)
 *  |    |-- lower (bullets & shields; these are rendered at the bottom)
 *  |    |-- main (ships and asteroids)
 *  |    |-- notices (e.g. +HP and +ammo notices)
 *  |-- hud (the HUD; gets rendered on top and is static)
 */
export const stages: {
	readonly [key: string]: PIXI.Container;
	readonly hud: PIXI.Container;
	readonly space: PIXI.Container;
	readonly lower: PIXI.Container;
	readonly main: PIXI.Container;
	readonly notices: PIXI.Container;
} = {
	background: new PIXI.Container(),
	hud: new PIXI.Container(),
	space: new PIXI.Container(),
	lower: new PIXI.Container(),
	main: new PIXI.Container(),
	notices: new PIXI.Container(),
};


export const rootStage = new PIXI.Container();
rootStage.addChild(stages.background);
rootStage.addChild(stages.space);
rootStage.addChild(stages.hud);
stages.space.addChild(stages.lower);
stages.space.addChild(stages.main);
stages.space.addChild(stages.notices);


export const score = new Score(config.render.hud.score, config.text);
stages.hud.addChild(score.display);


export const ammo = {
	counters: new Map<symbol, AmmoCounter>(),
	create(actorID: symbol, alias: string, initialAmmo: number): AmmoCounter {
		if (this.counters.has(actorID)) {
			throw new Error("AmmoCounter exists");
		}
		const {positions, padding} = config.render.hud.ammo;
		const counter = new AmmoCounter(
			textures.cached('AmmoSymbol.png'),
			padding,
			config.text,
			initialAmmo
		);
		const pos = positions[alias];
		counter.renderable.position.set(pos[0], pos[1]);
		stages.hud.addChild(counter.renderable);
		this.counters.set(actorID, counter);
		return counter;
	},
	at(actorID: symbol): AmmoCounter {
		const counter = this.counters.get(actorID);
		if (counter) {
			return counter;
		}
		throw new Error("No such counter");
	},
};


export const camera = new Camera(viewportWidth, viewportHeight, stages.space);
camera.moveTo(0, 0);


export const reset = (): void => {
	stages.lower.removeChildren();
	stages.main.removeChildren();
	stages.notices.removeChildren();
	camera.moveTo(0, 0);
	for (let counter of ammo.counters.values()) {
		stages.hud.removeChild(counter.renderable);
	}
	ammo.counters.clear();
};


export const renderOnce = (): void => {
	renderer.render(rootStage);
};


export const loop: RenderLoop = renderLoop(renderOnce);
