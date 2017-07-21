import {State} from 'jam/states/State';

import * as settings from 'game/settings';
import * as states from './index';


export interface MenuPreloadData {
	readonly selector: string;
}


const playGame = (ev: Event): void => {
	const numPlayers = +(ev.target as HTMLButtonElement).dataset.playerCount!;
	if (Number.isNaN(numPlayers)) {
		throw new Error("Invalid number of players");
	}
	settings.players.count = numPlayers;
	states.manager.trigger(states.Trigger.playGame);
};


export class MainMenu extends State {
	private element: HTMLElement;

	constructor(name: string) {
		super(name);
		const template: HTMLTemplateElement =
			document.getElementById('main-menu-tpl') as HTMLTemplateElement;
		this.element = (
			document
				.importNode(template.content, true)
				.getElementById('main-menu-container')
		) as HTMLElement;

		const buttons = this.element.querySelectorAll('.play-game');
		for (let i = 0, len = buttons.length; i < len; ++i) {
			buttons[i].addEventListener('click', playGame);
		}
	}

	protected doStart(data: MenuPreloadData): void {
		this.element!.classList.remove('hidden');
		document.getElementById('container')!.appendChild(this.element);
	}

	protected doStop(): void {
		this.element!.classList.add('hidden');
		document.getElementById('container')!.removeChild(this.element);
	}
}
