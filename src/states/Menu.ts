import {State} from 'jam/states/State';


export class Menu extends State {
	private template: HTMLTemplateElement = null;

	protected doPreload(): Promise<MenuPreloadData> {
		return files.json(`levels/${this.name}`);
	}

	protected doInit(data: MenuPreloadData): void {
		const template =
			document.getElementById(data.template) as HTMLTemplateElement;
		if (!template) {
			throw new Error(`No '${data.template}' template`);
		}
		this.template = template;
	}
}
