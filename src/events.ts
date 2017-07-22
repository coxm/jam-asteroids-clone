import * as jamEvents from 'jam/events/Manager';


/**
 * Enumerated event categories.
 *
 * Insert new categories here to define new event types.
 */
export const enum Category {
	collision,  // Normal physical contact.
	actorHasNoHealth,  // Actor has no health remaining.
	gunFired,  // A gun was fired.
	sectorEntered,  // A sector has been entered.
	sectorComplete,  // A sector has been completed.
	engineStarted,  // An engine started.
	engineStopped,  // An engine stopped.
	newSector,  // A request to create actors.
}


/** The type of data carried by each event. */
export type EventData = any;


/** The type of event emitted by the event manager. */
export type Event = jamEvents.Event<Category, EventData>;


/** The type of handler definitions passed to the event manager. */
export type HandlerItem = jamEvents.HandlerItem<Category, EventData>;


/** The type of the event manager. */
export type Manager = jamEvents.Manager<Category, EventData>;


/** The event manager. */
export const manager: Manager = new jamEvents.Manager();
