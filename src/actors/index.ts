import {Factory} from 'jam/actors/Factory';
import * as jamActors from 'jam/actors/Actor';
export { // Re-export types from here, so we can modify if required in future.
	Component,
	ComponentDef,
	ComponentBase,
	ActorDef,
	PartialActorDef,
} from 'jam/actors/Actor';

import {Physics, PhysicsDef} from 'game/actors/components/Physics';
import {
	Animated,
	create as createAnimatedSprite
} from 'game/actors/components/animated';
import {
	AsteroidDriver,
	AsteroidDriverDef,
} from 'game/actors/components/AsteroidDriver';
import {InputDriver, InputDriverDef} from 'game/actors/components/InputDriver';
import {
	KeyboardControl,
	KeyboardControlDef,
	Driver,
} from 'game/actors/components/KeyboardControl';


/** Components held by an actor. */
export interface ActorComponents {
	readonly [key: string]: jamActors.Component;
	readonly phys: Physics;
	readonly anim: Animated;
	readonly driver: Driver & jamActors.Component;
	readonly input: KeyboardControl;  // Caution: optional!
}


// Set the keys different components will appear at. If not set, the class name
// is used. Alternatively, individual components can override their prototype's
// key, allowing multiple components of the same type to be used.
Physics.prototype.key = 'phys';
Animated.prototype.key = 'anim';
InputDriver.prototype.key = AsteroidDriver.prototype.key = 'driver';
KeyboardControl.prototype.key = 'input';



/** Complete interface for actors in this game. */
export interface Actor extends jamActors.Actor {
	readonly cmp: ActorComponents;
}


export const factory = new Factory<Actor>();


// Define actor component factories here.
factory.setCmpFactories({
	animated: createAnimatedSprite,
	physics: (def: PhysicsDef, actorID: symbol, aDef: jamActors.ActorDef) =>
		new Physics(def, actorID, aDef),
	inputDriver: (def: InputDriverDef, actorID: symbol) =>
		new InputDriver(def, actorID),
	asteroidDriver: (def: AsteroidDriverDef, actorID: symbol) =>
		new AsteroidDriver(def, actorID),
	input: (def: KeyboardControlDef, actorID: symbol) =>
		new KeyboardControl(def, actorID),
});
