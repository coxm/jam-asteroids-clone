import {State, reset} from 'jam/states/State';
export {resume} from 'jam/states/State';
import {Relation} from 'jam/states/Relation';
import {Manager, TriggerEvent} from 'jam/states/Manager';

import config from 'assets/config';

import {manager as audio} from 'game/audio/index';

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
	sectorComplete,
	playerDied,
	startChild,
	splashDone,
}


/**
 * The state manager.
 *
 * Can be used to trigger state transitions, and stores the state tree (see
 * below).
 */
export const manager = new Manager<State, Trigger>({
	// This function gets called before `manager` acts on any trigger.
	preTrigger(ev: TriggerEvent<State, Trigger>): void {
		console.log(
			`[State preTrigger] ${ev.old.name} -> ${ev.new.name}. Event:`, ev
		);
	},
	// This function gets called after `manager` acts on any trigger.
	postTrigger(ev: TriggerEvent<State, Trigger>): void {
		console.log(
			`[State postTrigger] ${ev.old.name} -> ${ev.new.name}. Event:`, ev
		);
	},
});


// Configure our state tree:
//  Root (the root state)
//  |-- MadeForSplash
//  |-- TitleSplash
//  |-- MainMenu (the main menu state)
//      |-- Environment (the gameplay state; this has been imported above)
//      |   |-- Sector0
//      |   |-- Sector1
//      |   |-- ...
//      |-- GameComplete
//
const root = new State('Root');
const titleSplash = new Splash(
	'TitleSplash', 'SplashWelcome.jpg', config.splashes.titleTimeout);
const madeForSplash = new Splash(
	'MadeForSplash', 'MadeForCoopJam.png', config.splashes.madeForTimeout);
const gameCompleteSplash = new Splash('GameComplete', 'GameComplete.png');
const mainMenu = new MainMenu('MainMenu');
const environment = new Environment('Environment', audio);


// State transitions.
const initEnvironmentAndPlayGame = {
	trigger: Trigger.playGame,
	exit(mainMenu: MainMenu): void {
		mainMenu.detach();
	},
	async enter(env: Environment, trigger: Trigger, mgr: typeof manager) {
		env.deinit();  // Reset in case we already played.
		await environment.start();  // Start the environment state.
		environment.attach();  // Attach event handlers, rendering, audio, etc.
		mgr.trigger(Trigger.startChild);  // Start the first child.
	},
	rel: Relation.child,  // The environment is the first child of MainMenu.
};
const startFirstSector = {
	trigger: Trigger.startChild,
	enter(sector: Sector): Promise<void> {
		return environment.enterSector(sector);
	},
	rel: Relation.child,  // The sectors are children of Environment.
};
const advanceToNextSectorOnSuccess = {
	trigger: Trigger.sectorComplete,
	exit(previous: Sector): void {
		environment.leaveCurrentSector();
		previous.destroy();  // Will also detach the state etc.
	},
	async enter(nextState: Sector | Splash): Promise<void> {
		if (nextState instanceof Sector) {
			environment.enterSector(nextState);
		}
		else {
			throw new Error("Reached a splash screen");
		}
	},
	rel: Relation.sibling,
};
const returnToMainMenuOnPlayerDeath = {
	trigger: Trigger.playerDied,
	exit: reset,
	id: 'MainMenu',
};
const splashDone = {
	trigger: Trigger.splashDone,
	exit(old: Splash): void {
		old.destroy();
	},
	async enter(next: Splash | MainMenu): Promise<void> {
		await next.start();
		next.attach();
	},
	rel: Relation.sibling,
};


/** The transitions available for sectors. */
const sectorTransitions =
	[advanceToNextSectorOnSuccess, returnToMainMenuOnPlayerDeath];
/** The transitions available for splash screens. */
const splashTransitions = [splashDone];


/** Add sectors by specifying just an index. */
const addSector = (index: number): number => {
	const name = 'Sector' + index;
	return manager.add(new Sector(name), {
		alias: name,
		transitions: sectorTransitions,
	});
};


const addSplash = (splash: Splash): number => manager.add(splash, {
	alias: splash.name,
	transitions: splashTransitions,
});


// Add all states to the tree.
manager.add(environment, {
	alias: environment.name,
	children: ((): number[] => {
		const ids: number[] = [];
		for (let i = config.sectors.from; i <= config.sectors.to; ++i) {
			ids.push(addSector(i));
		}
		return ids;
	})(),
	transitions: [startFirstSector],
});
manager.add(mainMenu, {
	alias: mainMenu.name,
	children: [environment.name],
	transitions: [initEnvironmentAndPlayGame],
});
manager.add(root, {
	alias: root.name,
	children: [
		addSplash(titleSplash),
		addSplash(madeForSplash),
		mainMenu.name,
		addSplash(gameCompleteSplash),
	],
});


manager.set(titleSplash.name);  // Set the initial state.
