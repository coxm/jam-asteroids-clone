import {State} from 'jam/states/State';

import * as states from 'game/states/index';


export interface MenuPreloadData {
	readonly selector: string;
}


const play1P = (): void => {
	states.manager.trigger(states.Trigger.play1P);
};
const play2P = (): void => {
	states.manager.trigger(states.Trigger.play2P);
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
		this.element.querySelector('#btn-1p')!.addEventListener(
			'click', play1P);
		this.element.querySelector('#btn-2p')!.addEventListener(
			'click', play2P);
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
