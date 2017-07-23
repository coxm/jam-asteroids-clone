import {FileLoader} from 'jam/load/FileLoader';

import {cache} from './cache';


const filename: symbol = Symbol('filename');


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
	async json<T>(relpath: string): Promise<T> {
		const obj: T = await super.json<T>(relpath);
		(obj as any)[filename] = relpath;
		return obj;
	}
}
