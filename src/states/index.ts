import {State, resume, reset} from 'jam/states/State';
export {resume} from 'jam/states/State';
import {Relation} from 'jam/states/Relation';
import {Manager, TriggerEvent} from 'jam/states/Manager';

import {Level} from './Level';
import {Splash} from './Splash';
import {MainMenu} from './MainMenu';


/**
 * Enumerated state triggers.
 *
 * These are like events which the state manager responds to. See below for the
 * trigger configuration.
 */
export const enum Trigger {
	play1P,
	play2P,
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
	rel: Relation.sibling,
};
/** State transition: restart the current level on 'failure'. */
const restartOnFailure = {
	trigger: Trigger.failure,
	exit: reset,
	rel: Relation.same,
};
/** State transition: start the first 1p mission. */
const start1pMissionsOnSelect = {
	trigger: Trigger.play1P,
	exit: (state: State): void => state.detach(),
	id: '1pLevel0',
};
/** State transition: start the first 2p mission. */
const start2pMissionsOnSelect = {
	trigger: Trigger.play2P,
	exit: (state: State): void => state.detach(),
	id: '2pLevel0',
};


// Configure our state tree:
// MainMenu (root state)
//   |-- 1pMissions
//   |   |-- 1pLevel0
//   |   |-- GameComplete
//   |-- 2pMissions
//       |-- 2pLevel0
//       |-- GameComplete
const gameComplete = new Splash('GameComplete', 'GameComplete.png');
const mainMenuID = manager.add(new MainMenu('MainMenu'), {
	alias: 'MainMenu',
	children: [
		manager.add(new State('1pMissions'), {
			alias: '1pMissions',
			children: [
				manager.add(new Level('1pLevel0'), {
					alias: '1pLevel0',
					transitions: [advanceOnSuccess, restartOnFailure],
				}),
				gameComplete,
			],
		}),
		manager.add(new State('2pMissions'), {
			alias: '2pMissions',
			children: [
				manager.add(new Level('2pLevel0'), {
					alias: '2pLevel0',
					transitions: [advanceOnSuccess, restartOnFailure],
				}),
				gameComplete,
			],
		}),
	],
	transitions: [start1pMissionsOnSelect, start2pMissionsOnSelect],
});
manager.set(mainMenuID);  // Set the initial state.
