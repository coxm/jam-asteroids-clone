export interface BodyDef {
	readonly body: p2.BodyOptions;
	readonly shapes: p2.ShapeOptions[];
}


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


export function createBody(def: BodyDef): p2.Body {
	const bodyType = BODY_TYPES[def.body.type!];
	if (bodyType === undefined) {
		throw new Error(`Invalid body type: '${def.body.type}'`);
	}
	const body = new p2.Body(Object.assign({}, def.body, {
		type: bodyType,
	}));
	for (let shapeDef of def.shapes) {
		const Constructor = shapeConstructor(shapeDef.type!);
		const shape = new Constructor(shapeDef);
		body.addShape(
			shape,
			shape.position || [0, 0],
			shape.angle || 0
		);
	}
	return body;
}
