import {initKeyEvents} from 'jam/input/keyboard';

import * as events from 'game/events';
import * as render from 'game/render';
import * as states from 'game/states/index';


document.getElementById('container')!.appendChild(render.renderer.view);


// Initialise key events on the document body, without translating key codes to
// actions.
initKeyEvents(document.body);


events.manager
	.on(events.Category.levelSuccess, (): void => {
		states.manager.trigger(states.Trigger.success);
	})
	.on(events.Category.levelFailure, (): void => {
		states.manager.trigger(states.Trigger.failure);
	});


// Start the initial state.
states.resume(states.manager.current);
render.loop.start();
