import * as actors from 'game/actors/index';


const SHAPE_TYPES: {
	[key: string]: number;
	[key: number]: number;
} = {
	[p2.Shape.PARTICLE]: p2.Shape.PARTICLE,
	[p2.Shape.CAPSULE]: p2.Shape.CAPSULE,
	[p2.Shape.CIRCLE]: p2.Shape.CIRCLE,
	[p2.Shape.CONVEX]: p2.Shape.CONVEX,
	[p2.Shape.PLANE]: p2.Shape.PLANE,
	[p2.Shape.BOX]: p2.Shape.BOX,

	PARTICLE: p2.Shape.PARTICLE,
	CAPSULE: p2.Shape.CAPSULE,
	CIRCLE: p2.Shape.CIRCLE,
	CONVEX: p2.Shape.CONVEX,
	PLANE: p2.Shape.PLANE,
	BOX: p2.Shape.BOX,
};


const SHAPE_CONSTRUCTORS: {[key: number]: typeof p2.Shape;} = {
	[p2.Shape.PARTICLE]: p2.Particle,
	[p2.Shape.CAPSULE]: p2.Capsule,
	[p2.Shape.CIRCLE]: p2.Circle,
	[p2.Shape.CONVEX]: p2.Convex,
	[p2.Shape.PLANE]: p2.Plane,
	[p2.Shape.BOX]: p2.Box,
};


const shapeConstructor = (type: string | number): typeof p2.Shape => {
	if (!type) {
		throw new Error(`Invalid shape type: '${type}'`);
	}
	type = SHAPE_TYPES[type];
	return SHAPE_CONSTRUCTORS[type];
};


const BODY_TYPES: {
	[key: string]: number;
	[key: number]: number;
} = {
	[p2.Body.DYNAMIC]: p2.Body.DYNAMIC,
	[p2.Body.KINEMATIC]: p2.Body.KINEMATIC,
	[p2.Body.STATIC]: p2.Body.STATIC,

	DYNAMIC: p2.Body.DYNAMIC,
	KINEMATIC: p2.Body.KINEMATIC,
	STATIC: p2.Body.STATIC,
};


export interface PhysicsDef extends actors.ComponentDef {
	readonly body: p2.BodyOptions;
	readonly shapes: p2.ShapeOptions[];
}


export class Physics extends actors.ComponentBase {
	readonly body: p2.Body;

	constructor(def: PhysicsDef, actorID: symbol, actorDef: actors.ActorDef) {
		super(actorID);
		const bodyType = BODY_TYPES[def.body.type!];
		if (bodyType === undefined) {
			throw new Error(`Invalid body type: '${def.body.type}'`);
		}
		this.body = new p2.Body(Object.assign({}, def.body, {
			type: bodyType,
		}));
		if (actorDef.position) {
			this.body.position.set(actorDef.position);
		}
		for (let shapeDef of def.shapes) {
			const Constructor = shapeConstructor(shapeDef.type!);
			const shape = new Constructor(shapeDef);
			this.body.addShape(
				shape,
				shape.position || [0, 0],
				shape.angle || 0
			);
		}
	}

	onRemove(actor: actors.Actor): void {
		if (this.body.world) {
			this.body.world.removeBody(this.body);
		}
	}
}
