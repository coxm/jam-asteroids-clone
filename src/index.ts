import * as render from 'game/render';
import * as states from 'game/states/index';


document.getElementById('container')!.appendChild(render.renderer.view);


// Choose the state to start with.
states.manager.set('Level_0');
states.resume(states.manager.current).then((): void => {
	console.log('Starting game!');
});
