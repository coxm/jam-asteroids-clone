import {create as createBody, BodyDef} from 'jam/physics/body';

import * as actors from 'game/actors/index';
import {CollisionGroup} from 'game/physics';


export type PhysicsDef = actors.ComponentDef & BodyDef;


export class Physics extends actors.ComponentBase {
	readonly body: p2.Body;

	constructor(def: PhysicsDef, actorID: symbol, actorDef: actors.ActorDef) {
		super(actorID);
		this.body = createBody(def, CollisionGroup as any);
		if (actorDef.position) {
			this.body.position.set(actorDef.position);
		}
	}

	onRemove(actor: actors.Actor): void {
		if (this.body.world) {
			this.body.world.removeBody(this.body);
		}
	}
}
