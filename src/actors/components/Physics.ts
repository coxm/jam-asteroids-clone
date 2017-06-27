import {ActorDef, ComponentDef, ComponentBase} from 'jam/actors/Actor';


export interface PhysicsDef extends ComponentDef {
	readonly body: p2.BodyOptions;
}


export class Physics extends ComponentBase {
	readonly body: p2.Body;

	constructor(options: p2.BodyOptions, actorID: symbol) {
		super(actorID);
		this.body = new p2.Body(options);
	}
}


export const create = (
	def: PhysicsDef,
	actorID: symbol,
	actorDef: ActorDef
) => new Physics(def.body, actorID)
