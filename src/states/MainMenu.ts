import {State} from 'jam/states/State';

import * as states from 'game/states/index';


export interface MenuPreloadData {
	readonly selector: string;
}


const startGame = (): void => {
	states.manager.trigger(states.Trigger.play);
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
		this.element.querySelector('.btn-start-game')!.addEventListener(
			'click',
			startGame
		);
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
