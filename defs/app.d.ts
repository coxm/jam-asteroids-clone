declare module 'assets/config' {
	import {ManagerOptions} from 'game/audio/Manager';


	const config: {
		readonly updateFrequencyHz: number;
		readonly sectors: {
			readonly from: number;
			readonly to: number;
		};
		readonly viewport: {
			readonly outerBorder: AnyVec2;
			readonly innerMargin: AnyVec2;
		};
		readonly audio: ManagerOptions;
	};
	export = config;
}