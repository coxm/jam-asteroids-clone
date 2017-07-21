import {initKeyEvents} from 'jam/input/keyboard';

import * as render from 'game/render';
import * as states from 'game/states/index';


document.getElementById('container')!.appendChild(render.renderer.view);


// Initialise key events on the document body.
initKeyEvents(document.body);

// Start the initial state.
states.resume(states.manager.current);

// Start the render loop.
render.loop.start();
