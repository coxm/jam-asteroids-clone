import * as events from 'jam/events/Manager';


/**
 * Enumerated event categories.
 *
 * Insert new categories here to define new event types.
 */
export const enum Category {
}


/** The type of data carried by each event. */
export type EventData = any;


/** The type of event emitted by the event manager. */
export type Event = events.Event<Category, EventData>;


/** The event manager. */
export manager: Manager = new events.Manager<Category, EventData>();
