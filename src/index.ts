import * as render from 'game/render';
import * as states from 'game/states/index';


document.getElementById('container')!.appendChild(render.renderer.view);


// Start the initial state.
states.resume(states.manager.current);
render.loop.start();


const w = window as any;
w.render = render;
w.states = states;
w.level = states.manager.at('Level_0');
