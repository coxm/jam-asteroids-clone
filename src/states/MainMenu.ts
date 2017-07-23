import {State} from 'jam/states/State';

import * as settings from 'game/settings';
import * as states from './index';


export interface MenuPreloadData {
	readonly selector: string;
}


const onTogglePlayer = (button: HTMLButtonElement): void => {
	const playButton = document.getElementById('play') as HTMLButtonElement;
	const alias: string = button.dataset.player!;
	if (button.classList.toggle('on')) {
		settings.players.add(alias);
		playButton.disabled = false;
	}
	else {
		settings.players.delete(alias);
		for (const btn of Array.from(
			document.querySelectorAll('.toggle-player')
		)) {
			if (btn.classList.contains('on')) {
				return;
			}
		}
		playButton.disabled = true;
	}
};


const onPlay = (ev: Event): void => {
	states.manager.trigger(states.Trigger.playGame);
};


const createPlayerButton = (
	tpl: HTMLTemplateElement,
	index: number,
	controls: string | string[]
)
	: HTMLElement =>
{
	const elem = document.importNode(tpl.content, true).children[0] as
		HTMLButtonElement;
	for (const [selector, value] of [
		['.header', `Player ${index}`],
		['.up', controls[0]],
		['.left', controls[1]],
		['.down', controls[2]],
		['.right', controls[3]],
		['.shoot', controls[4]],
	]) {
		(elem.querySelector(selector)!.children[0] as HTMLElement)
			.innerText = value;
	}
	elem.dataset.player = `Player${index}`;
	elem.addEventListener('click', (ev: Event): void => {
		onTogglePlayer(elem);
	});
	return elem;
};


export class MainMenu extends State {
	private element: HTMLElement | null = null;

	protected doInit(): void {
		const template =
			document.getElementById('main-menu-tpl') as HTMLTemplateElement;
		this.element = (
			document
				.importNode(template.content, true)
				.getElementById('main-menu-container')
		) as HTMLElement;

		const tpl = document.getElementById('player-toggle-tpl') as
			HTMLTemplateElement;
		const rows = this.element.querySelectorAll('.player-toggles');
		rows[0].appendChild(createPlayerButton(tpl, 0, 'WASDX'));
		rows[0].appendChild(
			createPlayerButton(tpl, 1, ['K', 'H', 'J', 'L', 'Space']))

		const arrowsBtn = createPlayerButton(tpl, 2, ['', '', '', '', '']);
		for (let btn of Array.from(arrowsBtn.querySelectorAll('.keys'))) {
			btn.classList.add('arrow-keys');
		}
		rows[1].appendChild(arrowsBtn);
		rows[1].appendChild(
			createPlayerButton(tpl, 3, ['N8', 'N4', 'N2', 'N6', 'N0']));
		document.getElementById('container')!.appendChild(this.element!);
		document.getElementById('play')!.addEventListener('click', onPlay);
	}

	protected doAttach(): void {
		document.querySelector('canvas')!.classList.add('hidden');
		this.element!.classList.remove('hidden');
	}

	protected doDetach(): void {
		this.element!.classList.add('hidden');
		document.getElementById('container')!.removeChild(this.element!);
		document.querySelector('canvas')!.classList.remove('hidden');
	}
}
