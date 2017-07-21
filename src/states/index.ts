import {noop} from 'jam/util/misc';
import {State, resume, reset} from 'jam/states/State';
export {resume} from 'jam/states/State';
import {Relation} from 'jam/states/Relation';
import {Manager, TriggerEvent} from 'jam/states/Manager';

import {Sector} from './Sector';
import {Splash} from './Splash';
import {MainMenu} from './MainMenu';
import {Environment} from './Environment';


/**
 * Enumerated state triggers.
 *
 * These are like events which the state manager responds to. See below for the
 * trigger configuration.
 */
export const enum Trigger {
	playGame,
	success,
	failure,
	startChild,
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
	preTrigger(event: TriggerEvent<State, Trigger>): void {
		if (event.trigger === Trigger.startChild) {
			console.log('Descending', event.old.name, '->', event.new.name);
		}
		else {
			reset(event.old)
			console.log('Closing state', event.old.name);
		}
	},
	// This function gets called after `manager` acts on any trigger. It
	// starts up/resumes the new state.
	postTrigger(event: TriggerEvent<State, Trigger>): void {
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
/** State transition: start playing the game. */
const playGame = {
	trigger: Trigger.playGame,
	exit: (state: State): void => state.detach(),
	rel: Relation.child,
};
/** State transition: start first sector. */
const startFirstSector = {
	trigger: Trigger.startChild,
	exit: noop,  // Leave the parent state intact.
	rel: Relation.child,
};


/** The transitions available for levels. */
const levelTransitions = [advanceOnSuccess, restartOnFailure];


// Configure our state tree:
//  Root (the root state)
//  |-- WelcomeSplash (a splash screen welcoming the player)
//  |-- MainMenu (the main menu state)
//      |-- Environment (the gameplay state; this has been imported above)
//      |   |-- Sector0
//      |   |-- Sector1
//      |   |-- ...
//      |-- GameComplete
//
const root = new State('Root');
const welcomeSplash = new Splash('WelcomeSplash', 'MadeForCoopJam.png');
const gameComplete = new Splash('GameComplete', 'GameComplete.png');
const mainMenu = new MainMenu('MainMenu');
const environment = new Environment('Environment');


/** Add levels by specifying just an index. */
const addSector = (index: number): number => {
	const name = 'Sector' + index;
	return manager.add(new Sector(name), {
		alias: name,
		transitions: levelTransitions,
	});
};


// Add all states to the tree.
manager.add(environment, {
	alias: environment.name,
	children: [0, 1].map(addSector),
	transitions: [startFirstSector],
});
manager.add(mainMenu, {
	alias: mainMenu.name,
	children: [environment.name],
	transitions: [playGame],
});
manager.add(root, {
	alias: root.name,
	children: [
		welcomeSplash,
		mainMenu.name,
		gameComplete
	],
});


manager.set(mainMenu.name);  // Set the initial state.
