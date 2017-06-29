import {AnimationDef} from 'jam/render/animation'
import {Animated, AnimatedDef} from 'jam/actors/cmp/Animated';
export {Animated, AnimatedDef} from 'jam/actors/cmp/Animated';

import {ComponentDef} from 'game/actors/index';
import {textures} from 'game/load/index';


export interface RawAnimatedDef extends ComponentDef {
	readonly initial?: string | number;
	readonly stopped?: boolean;
	readonly texture: string | PIXI.Texture;
	readonly frameWidth: number;
	readonly frameHeight: number;
	readonly frameCount: number;
	readonly animations: {
		[id: string]: AnimationDef;
		[id: number]: AnimationDef;
	};
}


export const getAnimatedDef = (raw: RawAnimatedDef): AnimatedDef => {
	const texture: string | PIXI.Texture = raw.texture;
	if (typeof texture === 'object') {
		return raw as AnimatedDef;
	}

	const cached = textures.cached(raw.texture as string);
	if (!cached) {
		throw new Error(`Texture '${raw.texture}' has not been loaded`);
	}
	return Object.assign({}, raw, {
		texture: cached,
	}) as AnimatedDef;
};


export const create = (raw: RawAnimatedDef, actorID: symbol): Animated =>
	new Animated(getAnimatedDef(raw), actorID);
