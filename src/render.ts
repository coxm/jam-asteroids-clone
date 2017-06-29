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


export const stage = new PIXI.Container();
export const camera = new Camera(viewportWidth, viewportHeight, stage);


export const renderOnce = (): void => {
	renderer.render(stage);
};


export const loop: RenderLoop = renderLoop(renderOnce);
