import * as actors from 'jam/actors/Actor';
import {Factory} from 'jam/actors/Factory';
import {Animated, AnimatedDef} from 'jam/actors/cmp/Animated';

import {
	Physics,
	create as createPhysics
} from 'game/actors/components/Physics';


export type Component = actors.Component;
export type ComponentDef = actors.ComponentDef;
export type ActorDef = actors.ActorDef;


export interface ActorComponents {
	readonly [key: string]: Component;
	readonly physics: Physics;
	readonly animated: Animated;
}


export interface Actor extends actors.Actor {
	readonly cmp: ActorComponents;
}


export const factory = new Factory<Actor>();


// Define actor component factories here.
factory.setCmpFactories({
	animated: (ad: AnimatedDef, actorID: symbol) => new Animated(ad, actorID),
	physics: createPhysics,
});
