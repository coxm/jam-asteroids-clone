import {KeyboardControl as Base, Driver} from 'jam/actors/cmp/KeyboardControl';
export {Driver} from 'jam/actors/cmp/KeyboardControl';

import {Actor} from 'game/actors/index';


export class KeyboardControl extends Base {
	getDriver(actor: Actor): Driver {
		return actor.cmp.driver;
	}
}
