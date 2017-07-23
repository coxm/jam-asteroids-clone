import {AnimationDef} from 'jam/render/animation'
import {
	Animated as AnimatedBase,
	AnimatedDef as AnimatedBaseDef,
} from 'jam/actors/cmp/Animated';

import {ComponentDef} from 'game/actors/index';
import {textures} from 'game/load/index';


export interface RawAnimatedDef extends ComponentDef {
	readonly initial?: string | number;
	readonly stopped?: boolean;
	readonly texture: string | PIXI.Texture;
	readonly frameWidth: number;
	readonly frameHeight: number;
	readonly frameCount: number;
	readonly stage: string;
	readonly animations: {
		[id: string]: AnimationDef;
		[id: number]: AnimationDef;
	};
}


export interface AnimatedDef extends AnimatedBaseDef {
	readonly stage: string;
}


export const getAnimatedDef = (raw: RawAnimatedDef): AnimatedDef => {
	if (!raw.stage) {
		throw new Error("Animated def has no stage");
	}
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


export class Animated extends AnimatedBase {
	readonly stage: string;
	constructor(def: AnimatedDef, actorID: symbol) {
		super(def, actorID);
		this.stage = def.stage;
	}
}


export const create = (raw: RawAnimatedDef, actorID: symbol): Animated =>
	new Animated(getAnimatedDef(raw), actorID);
