declare module 'assets/config' {
	import {ManagerOptions} from 'game/audio/Manager';


	const config: {
		readonly updateFrequencyHz: number;
		readonly noticeDuration: number;
		readonly actorDefs: string[];
		readonly splashes: {
			readonly titleTimeout: number;
			readonly madeForTimeout: number;
		};
		readonly sectors: {
			readonly from: number;
			readonly to: number;
		};
		readonly render: {
			readonly viewport: {
				readonly outerBorder: AnyVec2;
				readonly innerMargin: AnyVec2;
			};
			readonly textures: string[];
		};
		readonly audio: ManagerOptions;
	};
	export = config;
}
