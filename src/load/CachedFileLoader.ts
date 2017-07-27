import {FileLoader} from 'jam/load/FileLoader';

import {cache} from './cache';


const filename: symbol = Symbol('filename');


export class CachedFileLoader extends FileLoader {
	/** All loaded files will be stored in this cache. */
	readonly cache: Map<string, any>;

	/** Load a plaintext file. */
	@cache
	async text(relpath: string): Promise<string> {
		return await fetch(this.abspath(relpath) + this.suffix).then(
			res => res.text());
	}

	/** Load a JSON file. */
	@cache
	async json<T>(relpath: string): Promise<T> {
		const res = await fetch(this.abspath(relpath) + this.suffix)
		const obj: any = await res.json();
		(obj as any)[filename] = relpath;
		return obj;
	}
}
