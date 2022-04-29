import { TranslationEngineOption } from './TranslationEngineOption';
import {
	TranslationEngineOptionCategories,
	TranslationEngineWrapper
} from './TranslationEngineWrapper';
import type { TextProcessor } from 'mtl-text-processor';

export class RedSugoiEngine extends TranslationEngineWrapper {
	protected aborted: boolean = false;
	protected paused: boolean = false;
	protected pauseQueue: Array<Function> = [];

	public constructor(processor: typeof TextProcessor, thisAddon: Addon) {
		super(processor, thisAddon, {
			id: 'redsugoi',
			name: 'Red Sugoi Translator',
			languages: {
				en: 'English',
				ja: 'Japanese'
			},
			batchDelay: 1,
			description: thisAddon.package.description,
			mode: 'rowByRow'
		});
	}

	protected urlUsage: number[] = [];

	protected getUrl() {
		let urls = this.optionUrls.getValue().split(/\r?\n/g);
		if (this.urlUsage.length != urls.length) {
			this.urlUsage = new Array(urls.length).fill(0);
		}
		let leastUsed = this.urlUsage.indexOf(Math.min(...this.urlUsage));
		this.urlUsage[leastUsed]++;
		return {
			url: urls[leastUsed],
			index: leastUsed
		};
	}

	protected freeUrl(urlIndex: number) {
		this.urlUsage[urlIndex]--;
	}

	public doTranslate(
		toTranslate: string[],
		options: TranslatorEngineOptions
	): Promise<string[]> {
		this.resetStatus();
		let returnTranslations: (translations: Array<string>) => void;
		let returnError: (reason: string) => void;

		if (options.sl != 'ja') {
			this.error(
				`[RedSugoi] The project specifies the source language as not being Japanese (${options.sl}). Since Sugoi Translator only supports Japanese as source, we will use Japanese instead.`
			);
		}

		if (options.tl != 'en') {
			this.error(
				`[RedSugoi] The project specifies the destination language as not being English (${options.tl}). Since Sugoi Translator only supports English as destination, we will use English instead.`
			);
		}

		let translations: string[] = new Array(toTranslate.length);
		let translatingIndex = 0;
		let completeThreads = 0;
		let totalThreads = this.optionConcurrency.getValue();
		totalThreads = totalThreads < 1 ? 1 : totalThreads;

		let maximumBatchSize = this.optionMaxLength.getValue();

		let complete = () => {
			if (++completeThreads == totalThreads) {
				returnTranslations(translations);
			}
		};

		let translationProgress = document.createTextNode('0');
		let translatedCount = 0;
		let errorProgress = document.createTextNode('');
		let errorCount = 0;

		this.print(
			document.createTextNode('[RedSugoi] Translating texts: '),
			translationProgress,
			document.createTextNode('/' + toTranslate.length),
			errorProgress
		);

		const updateTranslatedCount = (count: number) => {
			translatedCount += count;
			translationProgress.nodeValue = translatedCount.toString();
			options.progress(Math.round((100 * translatedCount) / toTranslate.length));
		};

		const updateErrorCount = (count: number) => {
			errorCount += count;
			errorProgress.nodeValue = ' (' + errorCount.toString() + ' failed translations)';
		};

		let serverScores: { [url: string]: number } = {};

		let startThread = () => {
			if (this.aborted) {
				returnError('Aborted.');
			}
			if (this.paused) {
				this.pauseQueue.push(() => {
					startThread();
				});
				return;
			}
			let batchLength = 0;
			let batch: Array<string> = [];
			let batchIndexes: Array<number> = [];

			while (translatingIndex < toTranslate.length) {
				let index = translatingIndex;
				if (
					toTranslate[index] !== undefined &&
					(batchLength == 0 ||
						batchLength + toTranslate[index].length <= maximumBatchSize)
				) {
					if (this.optionRemoveBreaks.getValue()) {
						toTranslate[index] = toTranslate[index].replaceAll(/\r?\n/g, ' ');
					}
					batch.push(toTranslate[index]);
					batchIndexes.push(index);
					batchLength += toTranslate[index].length;
					translatingIndex++;
				} else {
					break;
				}
			}

			if (batch.length == 0) {
				complete();
			} else {
				let myServer = this.getUrl();
				if (serverScores[myServer.url] == undefined) {
					serverScores[myServer.url] = 0;
				}
				fetch(myServer.url, {
					method: 'post',
					body: JSON.stringify({ content: batch, message: 'translate sentences' }),
					headers: { 'Content-Type': 'application/json' }
				})
					.then(async (response) => {
						if (response.ok) {
							serverScores[myServer.url] += batch.length;
							let result = await response.json();
							console.log('[RedSugoi] Fetched from ' + myServer.url, result);
							if (result.length != batch.length) {
								console.error('[REDSUGOI] MISMATCH ON RESPONSE:', batch, result);
								throw new Error(
									`Received invalid response - length mismatch, check server stability.`
								);
							} else {
								for (let i = 0; i < batch.length; i++) {
									translations[batchIndexes[i]] = result[i];
								}
							}
							updateTranslatedCount(batch.length);
						} else {
							throw new Error(`${response.status.toString()} - ${response.statusText}`);
						}
					})
					.catch((error) => {
						updateErrorCount(batch.length);
						console.error(
							'[REDSUGOI] ERROR ON FETCH USING ' + myServer,
							'   Payload: ' + batch.join('\n'),
							error
						);
						this.error(
							`[RedSugoi] Error while fetching from ${myServer.url} - ${error.name}: ${
								error.message
							}\n${' '.repeat(
								11
							)}If all fetch attempts fail on this server, check if it's still up.`
						);
					})
					.finally(() => {
						this.freeUrl(myServer.index);
						startThread();
					});
			}
		};

		return new Promise((resolve, reject) => {
			returnTranslations = resolve;
			returnError = reject;

			for (let i = 0; i < totalThreads; i++) {
				startThread();
			}
		});
	}

	public resetStatus() {
		this.aborted = false;
		this.paused = false;
		this.pauseQueue = [];
	}

	public abort() {
		this.aborted = true;
	}

	public pause() {
		this.paused = true;
	}

	public resume() {
		this.paused = false;
		this.pauseQueue.forEach((action) => {
			action();
		});
		this.pauseQueue = [];
	}

	public optionUrls: TranslationEngineOption<string> =
		new TranslationEngineOption<string>({
			wrapper: this,
			id: 'urls',
			default: ['http://localhost:14366/'].join('\n'),
			description:
				"URLs for the Sugoi Translator servers. Place one per line. There will be an attempt to balance the load between servers such that every server has the same amount of active requests open, so it's also important to pick a good request count number to match your servers (usually two times the number of servers is good enough).",
			name: 'Sugoi Translator URLs',
			category: TranslationEngineOptionCategories.LIMITS,
			priority: -10,
			formType: 'textarea',
			formOptions: {
				height: '50px'
			}
		});

	public optionRemoveBreaks: TranslationEngineOption<boolean> =
		new TranslationEngineOption<boolean>({
			wrapper: this,
			id: 'removeBreaks',
			default: false,
			description: [
				'Sugoi Translator does not understand line breaks.',
				"This option replaces all line breaks with an space before translation. This hasn't been thoroughly tested, so there is no knowledge of whether this improves translation quality or not, but it should, in theory."
			].join('\n'),
			name: 'Remove Line Breaks',
			category: TranslationEngineOptionCategories.OPTIONS
		});

	/**
	 * Limits
	 */
	public optionMaxLength: TranslationEngineOption<number> =
		new TranslationEngineOption<number>({
			wrapper: this,
			id: 'maxTranslationLength',
			default: 100,
			description: [
				'Maximum amount of characters that will be sent per server request.',
				"Sugoi translator can crash if you send text that is bigger than your RAM/VRAM can handle, so you can set an upper limit here. In general, the higher this number is, the faster the translation process will be - so long as you don't run out of memory. The default value is very conservative, feel free to increase it until your hardware cries.",
				"Note: if an atomic string (that can't be split) is larger than this amount, it will still be sent in full, but it will be sent alone."
			].join('\n'),
			name: 'Request Character Limit',
			category: TranslationEngineOptionCategories.LIMITS,
			priority: -9
		});

	public optionConcurrency: TranslationEngineOption<number> =
		new TranslationEngineOption<number>({
			wrapper: this,
			id: 'maxTranslationJobs',
			default: 2,
			description:
				'Maximum amount of requests sent to the servers at the same time. The best number if the one that results in no downtime for the servers.',
			name: 'Maximum Request Count',
			category: TranslationEngineOptionCategories.LIMITS,
			priority: -8
		});
}
