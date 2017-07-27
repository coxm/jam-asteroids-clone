import {State} from 'jam/states/State';
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
	gameComplete,
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
//  |-- GameOverSplash (only seen if a player dies)
//  |-- TitleSplash (the starting state)
//  |-- MadeForSplash
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
const gameCompleteSplash = new Splash(
	'GameComplete', 'SplashGameComplete.jpg');
const gameOverSplash = new Splash('GameOver', 'SplashGameOver.jpg');
const mainMenu = new MainMenu('MainMenu');
const environment = new Environment('Environment', audio);


/** Skip the current state if it's a splash screen. */
const skipIfCurrentIsSplashScreen = (): void => {
	if (manager.current instanceof Splash) {
		manager.trigger(Trigger.splashDone);
	}
};
document.body.addEventListener('click', skipIfCurrentIsSplashScreen);
document.body.addEventListener('keydown', skipIfCurrentIsSplashScreen);


// State transitions.
const initEnvironmentAndPlayGame = {
	trigger: Trigger.playGame,
	exit(mainMenu: MainMenu): void {
		mainMenu.detach();
		mainMenu.deinit();
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
			audio.reset();
			environment.stop();
			await nextState.start();
			nextState.attach();
		}
	},
	rel: Relation.sibling,
};

const gameCompleteOnLastSectorDone = {
	trigger: Trigger.gameComplete,
	exit(previous: Sector): void {
		previous.stop();
		previous.detach();
		environment.stop();
		environment.detach();
	},
	async enter(next: Splash): Promise<void> {
		await next.init();
		next.attach();
		await next.start();
	},
	id: gameCompleteSplash.name,
};

const gameOverOnPlayerDied = {
	trigger: Trigger.playerDied,
	exit(sector: Sector): void {
		sector.stop();
		environment.stop();
		audio.music.gameplay.reset();
	},
	async enter(gameOver: Splash): Promise<void> {
		await gameOver.start();
		gameOver.attach();
		audio.music.failure.play();
		audio.reset();
	},
	id: gameOverSplash.name,
};

const splashDone = {
	trigger: Trigger.splashDone,
	exit(old: Splash): void {
		old.stop();
		old.detach();
		if (old === gameOverSplash) {
			audio.music.failure.reset();
		}
	},
	async enter(next: Splash | MainMenu): Promise<void> {
		await next.start();
		next.attach();
		if (next === titleSplash) {
			audio.music.gameplay.reset();
			audio.music.gameplay.play();
		}
	},
	rel: Relation.sibling,
};

const gameCompleteSplashDismissed = {
	trigger: Trigger.splashDone,
	exit(old: Splash): void {
		old.stop();
		old.detach();
		audio.music.success.reset();
	},
	async enter(next: MainMenu): Promise<void> {
		await next.start();
		next.attach();
	},
	id: mainMenu.name,
};


/** The transitions available for sectors. */
const sectorTransitions = [
	advanceToNextSectorOnSuccess,
	gameOverOnPlayerDied,
	gameCompleteOnLastSectorDone,
];
/** Add sectors by specifying just an index. */
const addSector = (index: number): number => {
	const name = 'Sector' + index;
	return manager.add(new Sector(name), {
		alias: name,
		transitions: sectorTransitions,
	});
};


/** The transitions available for splash screens. */
const splashTransitions = [splashDone];
/** Add a splash screen state. */
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
		addSplash(gameOverSplash),
		addSplash(titleSplash),
		addSplash(madeForSplash),
		mainMenu.name,
		manager.add(gameCompleteSplash, {
			alias: gameCompleteSplash.name,
			transitions: [gameCompleteSplashDismissed],
		}),
	],
});


manager.set(titleSplash.name);  // Set the initial state.
