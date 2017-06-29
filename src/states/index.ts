import {State, resume, reset} from 'jam/states/State';
export {resume} from 'jam/states/State';
import {Relation} from 'jam/states/Relation';
import {Manager, TriggerEvent} from 'jam/states/Manager';

import {Level} from './Level';
import {MainMenu} from './MainMenu';


/**
 * Enumerated state triggers.
 *
 * These are like events which the state manager responds to. See below for the
 * trigger configuration.
 */
export const enum Trigger {
	play,
	success,
	failure,
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


/** State transition: advance to the next level on 'success'. */
const advanceOnSuccess = {
	trigger: Trigger.success,
	exit: (state: State): void => state.destroy(),
	// Using `Relation.siblingElseUp` indicates that when the final level is
	// complete, the state manager reverts to the parent state (i.e. MainMenu).
	rel: Relation.siblingElseUp,
};
/** State transition: restart the current level on 'failure'. */
const restartOnFailure = {
	trigger: Trigger.failure,
	exit: reset,
	rel: Relation.same,
};
/** State transition: start the first child state on 'play'. */
const startFirstChild = {
	trigger: Trigger.play,
	exit: (state: State): void => state.detach(),
	rel: Relation.child,
};


// Configure our state tree:
// MainMenu (root state)
//   |-- Level_0
//   |-- Level_1
const mainMenuID = manager.add(new MainMenu('MainMenu'), {
	alias: 'MainMenu',
	children: [
		manager.add(new Level('Level_0'), {
			alias: 'Level_0',
			transitions: [advanceOnSuccess, restartOnFailure],
		}),
		manager.add(new Level('Level_1'), {
			alias: 'Level_1',
			transitions: [advanceOnSuccess, restartOnFailure],
		}),
	],
	transitions: [startFirstChild],
});
manager.set(mainMenuID);  // Set the initial state.
