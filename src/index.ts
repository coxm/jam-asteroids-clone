import * as render from 'game/render';
import * as states from 'game/states/index';
import 'game/input';


document.getElementById('container')!.appendChild(render.renderer.view);


// Start the initial state.
states.resume(states.manager.current);
render.loop.start();
