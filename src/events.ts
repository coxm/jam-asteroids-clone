import * as jamEvents from 'jam/events/Manager';


/**
 * Enumerated event categories.
 *
 * Insert new categories here to define new event types.
 */
export const enum Category {
	physNormalContact,  // Normal physical contact.
	actorHasNoHealth,  // Actor has no health remaining.
	createProjectile,  // Create projectile request.
	levelSuccess,  // Level completed.
	levelFailure,  // Level failed.
}


/** The type of data carried by each event. */
export type EventData = any;


/** The type of event emitted by the event manager. */
export type Event = jamEvents.Event<Category, EventData>;


export type Manager = jamEvents.Manager<Category, EventData>;


/** The event manager. */
export const manager: Manager = new jamEvents.Manager();
