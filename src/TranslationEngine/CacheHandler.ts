import type { TranslationEngineOption } from './TranslationEngineOption';
import type { TranslationEngineWrapper } from './TranslationEngineWrapper';

export interface TranslationEngineWrapperCache {
	getId(): string;
	optionCachePersistent: TranslationEngineOption<boolean>;
	optionCachePersistentSize: TranslationEngineOption<number>;
}

export class CacheHandler {
	private fs = require('fs');
	private wrapper: TranslationEngineWrapperCache;
	private cache: { [key: string]: Array<string | number> } = {};
	private changed = false;
	private busy = false;
	private next: Function | undefined;
	private maximumCacheHitsOnLoad = 10;
	private cacheDegradationLevel = 1;

	private loaded: boolean = false;

	public constructor(wrapper: TranslationEngineWrapperCache) {
		this.wrapper = wrapper;
	}

	public addCache(key: string, translation: string) {
		this.cache[key] = [translation, 1];
		this.changed = true;
	}

	public resetCache() {
		this.cache = {};
		this.changed = true;
	}

	public hasCache(key: string) {
		return typeof this.cache[key] != 'undefined';
	}

	public getCache(key: string): string {
		(<number>this.cache[key][1]) += 1;
		return <string>this.cache[key][0];
	}

	public getFilename(bak?: boolean): string {
		// Dirname is now THIS FILE'S folder!!!!
		return `${__dirname}/../../Cache${this.wrapper.getId()}.json${
			bak === true ? '.bak' : ''
		}`;
	}

	public loadCache(bak?: boolean) {
		if (this.loaded || !this.wrapper.optionCachePersistent.getValue()) {
			return;
		}
		if (this.fs.existsSync(this.getFilename(bak === true))) {
			try {
				let rawdata = this.fs.readFileSync(this.getFilename(bak === true));
				this.cache = {};
				let arr = JSON.parse(rawdata);
				if (Array.isArray(arr)) {
					for (let i = 0; i < arr.length; i++) {
						let aggregateHits = arr[i][2];
						if (aggregateHits > this.maximumCacheHitsOnLoad) {
							aggregateHits = this.maximumCacheHitsOnLoad;
						} else {
							aggregateHits -= this.cacheDegradationLevel;
							// We don't want to continually decrease it until it can no longer raise, we just want it to lose priority over time.
							if (aggregateHits < 0) {
								aggregateHits = 0;
							}
						}
						this.cache[arr[i][0]] = [arr[i][1], aggregateHits];
					}
				} else if (typeof arr == 'object') {
					// old version, code adapt
					for (let key in arr) {
						this.cache[key] = [arr[key], 1];
					}
				}
				this.changed = false;
			} catch (e) {
				this.cache = {};
				console.error(
					'[RedPersistentCacheHandler] Load error for cache ' +
						this.wrapper.getId() +
						'. Resetting.',
					e
				);
				if (bak !== true) {
					console.warn(
						'[RedPersistentCacheHandler] Attempting to load backup cache for ' +
							this.wrapper.getId() +
							'.'
					);
					this.loadCache(true);
				}
			}
		} else {
			console.warn(
				'[RedPersistentCacheHandler] No cache found for ' + this.wrapper.getId() + '.'
			);
			if (bak !== true) {
				console.warn(
					'[RedPersistentCacheHandler] Attempting to load backup cache for ' +
						this.wrapper.getId() +
						'.'
				);
				this.loadCache(true);
			}
		}
	}

	public saveCache() {
		if (!this.wrapper.optionCachePersistent.getValue()) {
			return;
		}
		if (!this.changed) {
			console.warn(
				'[RedPersistentCacheHandler] Not saving cache as there have been no changes.'
			);
			return;
		}
		let arr: Array<any> = [];
		let maxSize = this.wrapper.optionCachePersistentSize.getValue() * 1024 * 1024;
		let size = 0;
		for (let key in this.cache) {
			arr.push([key, this.cache[key][0], this.cache[key][1]]);
			size += this.getSize(`"${key}":["${this.cache[key][0]}", ${this.cache[key][1]}`);
		}

		arr.sort((a: Array<any>, b: Array<any>) => {
			return b[2] - a[2];
		});

		while (size > maxSize && arr.length > 0) {
			let pop = arr.pop()!;
			size -= this.getSize(`"${pop[0]}":["${pop[1]}", ${pop[2]}`);
		}

		try {
			let write = () => {
				try {
					this.fs.renameSync(this.getFilename(), this.getFilename(true));
				} catch (e) {
					console.warn(
						'[RedPersistentCacheHandler] Could not create backup. Is the file not there?',
						e
					);
				}
				this.fs.writeFile(
					this.getFilename(),
					JSON.stringify(arr, undefined, 1),
					(err: Error | undefined) => {
						this.busy = false;
						if (err) {
							console.error(err);
						} else {
							console.log('[RedPersistentCacheHandler] Successfully saved cache.');
						}
						let next = this.next;
						if (typeof next == 'function') {
							this.next = undefined;
							next();
						} else {
							this.busy = false;
						}
					}
				);
			};
			if (this.busy) {
				this.next = write;
			} else {
				this.busy = true;
				write();
			}
		} catch (e) {
			console.error(
				'[RedPersistentCacheHandler] Failed saving cache for ' +
					this.wrapper.getId() +
					'.',
				e
			);
		}
	}

	public getSize(cache: string) {
		//return (new TextEncoder().encode(cache)).length;
		return cache.length * 2; // it was too slow, we will assume: HALF IS JAPANESE HALF IS ENGLISH SO 2 BYTES PER CHARACTER, probably still a bit pessimistic, which is good enough of an approximation
	}
}
