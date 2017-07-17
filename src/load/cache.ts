import {cacheUnderFirstArgument} from 'jam/load/cache';


/** A decorator which caches in a 'cache' property under the first argument. */
export const cache = cacheUnderFirstArgument('cache');
