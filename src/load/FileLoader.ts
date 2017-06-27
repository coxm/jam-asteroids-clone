import {FileLoader} from 'jam/load/FileLoader';
import {cacheUnderFirstArgument} from 'jam/load/cache';


const cacheFiles = cacheUnderFirstArgument('cache');


export class CachedFileLoader extends FileLoader {
	/** All loaded files will be stored in this cache. */
	readonly cache: Map<string, any>;

	/** Load a plaintext file. */
	@cacheFiles
	text(relpath: string): Promise<string> {
		return super.text(relpath);
	}

	/** Load a JSON file. */
	@cacheFiles
	json<T>(relpath: string): Promise<T> {
		return super.json(relpath);
	}
}
