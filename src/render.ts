import {Camera} from 'jam/render/Camera';
import {loop as renderLoop, RenderLoop} from 'jam/render/loop';
export {RenderLoop} from 'jam/render/loop';


export type Renderer = PIXI.CanvasRenderer | PIXI.WebGLRenderer;


export const viewportWidth = 640;
export const viewportHeight = 480;

export const renderer: Renderer = PIXI.autoDetectRenderer(
	viewportWidth,
	viewportHeight,
	{
		backgroundColor: 0x333333,
		antialias: true,
	}
);


/**
 * The render stage tree.
 *
 * rootStage
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
	hud: new PIXI.Container(),
	space: new PIXI.Container(),
	lower: new PIXI.Container(),
	main: new PIXI.Container(),
	notices: new PIXI.Container(),
};


export const rootStage = new PIXI.Container();
rootStage.addChild(stages.space);
rootStage.addChild(stages.hud);
stages.space.addChild(stages.lower);
stages.space.addChild(stages.main);
stages.space.addChild(stages.notices);


let scoreValue: number = 0;
const scoreDisplay = new PIXI.Text('Score: 0');
scoreDisplay.position.set(500, 420);
stages.hud.addChild(scoreDisplay);


export const score = {
	get display() {
		return scoreDisplay;
	},
	get value(): number {
		return scoreValue;
	},
	set value(val: number) {
		if (scoreValue !== val) {
			scoreValue = val;
			scoreDisplay.text = 'Score: ' + val;
		}
	},
};


export const camera = new Camera(viewportWidth, viewportHeight, stages.space);
camera.moveTo(0, 0);


export const renderOnce = (): void => {
	renderer.render(rootStage);
};


export const loop: RenderLoop = renderLoop(renderOnce);
