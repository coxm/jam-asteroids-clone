declare module 'assets/config' {
	import {ManagerOptions} from 'game/audio/Manager';


	const config: {
		readonly updateFrequencyHz: number;
		readonly noticeDuration: number;
		readonly smallAsteroidAmmoBonuses: number[];
		readonly actorDefs: string[];
		readonly splashes: {
			readonly titleTimeout: number;
			readonly madeForTimeout: number;
			readonly gameOverTimeout: number;
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
			readonly hud: {
				readonly score: {
					readonly position: AnyVec2;
					readonly anchor: AnyVec2;
				};
				readonly ammo: {
					readonly padding: number;
					readonly positions: {
						readonly [key: string]: AnyVec2;
						readonly Player0: AnyVec2;
						readonly Player1: AnyVec2;
						readonly Player2: AnyVec2;
						readonly Player3: AnyVec2;
					};
				};
			};
		};
		readonly audio: ManagerOptions;
	};
	export = config;
}
