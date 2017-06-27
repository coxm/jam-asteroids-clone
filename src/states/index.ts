import {State, resume, reset, destroy} from 'jam/states/State';
export {resume} from 'jam/states/State';
import {Relation} from 'jam/states/Relation';
import {Manager, TriggerEvent, AddOptions} from 'jam/states/Manager';

import {Level} from './Level';


/**
 * Enumerated state triggers.
 *
 * These are like events which the state manager responds to. See below for the
 * trigger configuration.
 */
export const enum Trigger {
	failure,
	success,
}


/**
 * The state manager.
 *
 * Can be used to trigger state transitions, and stores the state tree (see
 * below).
 */
export const manager = new Manager<State, Trigger>({
	// This function gets called before `manager` acts on any trigger. It
	// pauses, detaches and stops the old state.
	preTrigger: (event: TriggerEvent<State, Trigger>): void => {
		reset(event.old)
		console.log('Closing state', event.old.name);
	},
	// This function gets called after `manager` acts on any trigger. It
	// starts up/resumes the new state.
	postTrigger: (event: TriggerEvent<State, Trigger>): void => {
		resume(event.new);
		console.log('Started state', event.new.name);
	},
});


/** Add a state and provide its `name` property as an alias. */
const add = (state: State, options?: AddOptions<State, Trigger>): number =>
	manager.add(state, Object.assign({}, options, {
		alias: state.name,
	}));


const level0 = add(new Level('Level_0'));
const level1 = add(new Level('Level_1'));


// Configure our state tree:
// RootState
// |-- Level_0
// |-- Level_1
add(new State('RootState'), {
	children: [
		level0,
		level1,
	],
});


// Configure state triggers.
const advanceOnSuccess = {
	trigger: Trigger.success,
	exit: destroy,
	rel: Relation.sibling,
};
const restartOnFailure = {
	trigger: Trigger.failure,
	exit: reset,
	rel: Relation.same,
};
const completeGameOnSuccess = {
	trigger: Trigger.success,
	exit: destroy,
	rel: Relation.parent,
};
manager.onMany(level0, [restartOnFailure, advanceOnSuccess]);
manager.onMany(level1, [restartOnFailure, completeGameOnSuccess]);
