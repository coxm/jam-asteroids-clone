import {initKeyEvents} from 'jam/input/keyboard';

import config from 'assets/config';

import * as render from 'game/render/index';
import * as states from 'game/states/index';
import * as audio from 'game/audio/index';


document.getElementById('container')!.appendChild(render.renderer.view);


// Initialise key events on the document body.
initKeyEvents(document.body);

// Start the initial state.
states.resume(states.manager.current);

// Start the render loop.
render.loop.start();

// Start the intro music.
if (config.audio.master! > 0) {
	audio.manager.music.play();
}
