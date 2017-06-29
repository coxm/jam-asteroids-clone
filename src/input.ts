import {initKeyEvents} from 'jam/input/keyboard';
import {KeyCode} from 'jam/input/KeyCode';
import {KeyAction} from 'jam/input/KeyAction';


/** Dict which translates a keyboard code into an 'action'. */
const KEY_CODE_TO_ACTION = {
	[KeyCode.ArrowUp]: KeyAction.up,
	[KeyCode.ArrowDown]: KeyAction.down,
	[KeyCode.ArrowLeft]: KeyAction.left,
	[KeyCode.ArrowRight]: KeyAction.right,
};


// Initialise key events on the document body, translating key codes to actions
// which then get dispatched through the `keyup` and `keydown` handlers.
initKeyEvents(document.body, (code: KeyCode) => KEY_CODE_TO_ACTION[code]);
