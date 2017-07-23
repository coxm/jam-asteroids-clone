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


export const stages: {
	readonly [key: string]: PIXI.Container;
	readonly hud: PIXI.Container;
	readonly projectiles: PIXI.Container;
	readonly main: PIXI.Container;
} = {
	hud: new PIXI.Container(),  // The HUD; contains e.g. the score dispaly.
	projectiles: new PIXI.Container(),  // For bullets and other projectiles.
	main: new PIXI.Container(),  // Contains ships and asteroids.
};


/** The root stage (private). */
const rootStage = new PIXI.Container();
rootStage.addChild(stages.projectiles);  // Projectiles at bottom.
rootStage.addChild(stages.main);  // Then the ships and asteroides.
rootStage.addChild(stages.hud);  // HUD on top.


let scoreValue: number = 0;
const scoreDisplay = new PIXI.Text('Score: 0');
scoreDisplay.position.set(180, 200);
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


export const camera = new Camera(viewportWidth, viewportHeight, rootStage);
camera.moveTo(0, 0);


export const renderOnce = (): void => {
	renderer.render(rootStage);
};


export const loop: RenderLoop = renderLoop(renderOnce);
