import {
	KeyboardControl as ControlBase,
	Driver as DriverBase
} from 'jam/actors/cmp/KeyboardControl';
import {KeyCode} from 'jam/input/KeyCode';

import {Actor, ComponentDef} from 'game/actors/index';


export interface Driver extends DriverBase {
	shoot(): void;
}


type InputType = 'arrows' | 'wasd' | 'numpad';


const KEYDOWN_HANDLERS = {
	wasd: (driver: Driver): [KeyCode, () => void][] => [
		[KeyCode.w, driver.up.bind(driver)],
		[KeyCode.s, driver.down.bind(driver)],
		[KeyCode.a, driver.left.bind(driver)],
		[KeyCode.d, driver.right.bind(driver)],
		[KeyCode.q, driver.shoot.bind(driver)],
	],
	arrows: (driver: Driver): [KeyCode, () => void][] => [
		[KeyCode.ArrowUp, driver.up.bind(driver)],
		[KeyCode.ArrowDown, driver.down.bind(driver)],
		[KeyCode.ArrowLeft, driver.left.bind(driver)],
		[KeyCode.ArrowRight, driver.right.bind(driver)],
		[KeyCode.Space, driver.shoot.bind(driver)],
	],
	numpad: (driver: Driver): [KeyCode, () => void][] => [
		[KeyCode.NumPad8, driver.up.bind(driver)],
		[KeyCode.NumPad2, driver.down.bind(driver)],
		[KeyCode.NumPad4, driver.left.bind(driver)],
		[KeyCode.NumPad6, driver.right.bind(driver)],
		[KeyCode.NumPad0, driver.shoot.bind(driver)],
	],
};


const KEYUP_HANDLERS = {
	wasd: (driver: Driver): [KeyCode, () => void][] => [
		[KeyCode.w, driver.stopUp.bind(driver)],
		[KeyCode.s, driver.stopDown.bind(driver)],
		[KeyCode.a, driver.stopLeft.bind(driver)],
		[KeyCode.d, driver.stopRight.bind(driver)],
	],
	arrows: (driver: Driver): [KeyCode, () => void][] => [
		[KeyCode.ArrowUp, driver.stopUp.bind(driver)],
		[KeyCode.ArrowDown, driver.stopDown.bind(driver)],
		[KeyCode.ArrowLeft, driver.stopLeft.bind(driver)],
		[KeyCode.ArrowRight, driver.stopRight.bind(driver)],
	],
	numpad: (driver: Driver): [KeyCode, () => void][] => [
		[KeyCode.NumPad8, driver.stopUp.bind(driver)],
		[KeyCode.NumPad2, driver.stopDown.bind(driver)],
		[KeyCode.NumPad4, driver.stopLeft.bind(driver)],
		[KeyCode.NumPad6, driver.stopRight.bind(driver)],
	],
};


export interface KeyboardControlDef extends ComponentDef {
	readonly type: InputType;
}


export class KeyboardControl extends ControlBase {
	private readonly type: InputType
	constructor(def: KeyboardControlDef, actorID: symbol) {
		super(actorID);
		this.type = def.type;
	}

	getDriver(actor: Actor): Driver {
		return actor.cmp.driver;
	}

	getKeyDownHandlers(driver: Driver): [PropertyKey, () => void][] {
		return KEYDOWN_HANDLERS[this.type](driver);
	}

	getKeyUpHandlers(driver: Driver): [PropertyKey, () => void][] {
		return KEYUP_HANDLERS[this.type](driver);
	}
}
