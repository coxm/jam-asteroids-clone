import {ContactManager, NormalContactEvent} from 'jam/physics/ContactManager';

import * as events from 'game/events';


export enum CollisionGroup {
	players =   0b0001,
	bullets =   0b0010,
	asteroids = 0b0100,
}


export const world = new p2.World({
	gravity: [0, 0],
});


export const contacts = new ContactManager({
	onNormalContact(ev: NormalContactEvent): void {
		events.manager.fire(events.Category.collision, ev);
	},
});
contacts.install(world);
