import {FileLoader} from 'jam/load/FileLoader';

import {cache} from './cache';


export class CachedFileLoader extends FileLoader {
	/** All loaded files will be stored in this cache. */
	readonly cache: Map<string, any>;

	/** Load a plaintext file. */
	@cache
	text(relpath: string): Promise<string> {
		return super.text(relpath);
	}

	/** Load a JSON file. */
	@cache
	json<T>(relpath: string): Promise<T> {
		return super.json(relpath);
	}
}
