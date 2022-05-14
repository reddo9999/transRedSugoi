import {
	TextProcessor,
	TextProcessorPattern,
	PlaceholderType,
	TextProcessorOrderType,
	PlaceholderRecoveryType
} from '@redsugoi/mtl-text-processor';

import { isolationGroupsRegExp, PlaceholderTypeNames } from './_Constants';
import { TranslationEngineOption } from './TranslationEngineOption';
import { CacheHandler, TranslationEngineWrapperCache } from './CacheHandler';
import { RedPerformance } from './RedPerformance';

export enum TranslationEngineOptionCategories {
	PATTERNS = 'Patterns',
	LIMITS = 'Limits',
	OPTIONS = 'Options'
}

const TranslationEngineOptionCategoriesPriority: { [id: string]: number } = {
	Options: 0,
	Limits: 1,
	Patterns: 999
};

export const PatternExplanation = `You can have multiple patterns, separated by commas. A pattern is either a global Regular Expression or a function (wholeString : string, passCount : number) which returns a global regular expression / nothing.`;

export abstract class TranslationEngineWrapper implements TranslationEngineWrapperCache {
	protected translatorEngine: TranslatorEngine;
	protected processor: TextProcessor;
	protected cache = new CacheHandler(this);

	public abstract doTranslate(
		toTranslate: Array<string>,
		options: TranslatorEngineOptions
	): Promise<Array<string>>;

	public translate(
		rows: Array<string>,
		translationOptions: Partial<TranslatorEngineOptions>
	) {
        if ((<HTMLElement> document.getElementById("loadingOverlay")).classList.contains("hidden")) {
            ui.showBusyOverlay();
        }

		let batchPerformance = new RedPerformance();
		let savedSL: string, savedTL: string;
		try {
			savedSL = trans.getSl();
			savedTL = trans.getTl();
		} catch (e) {
			savedSL = 'ja';
			savedTL = 'en';
		}

		let options: TranslatorEngineOptions = Object.assign(
			{
				onAfterLoading: () => {},
				onError: () => {},
				always: () => {},
				progress: () => {},
				sl: savedSL,
				tl: savedTL
			},
			translationOptions
		);

		const getCacheKey = (text: string) => {
			return options.sl + options.tl + text;
		};

		this.processorInit();
		let process = this.processor.process(...rows);
		let toTranslate = process.getTranslatableLines();
		let translations = new Array(toTranslate.length);

		if (this.optionUseCache.getValue()) {
			this.cache.loadCache();
			// Remove cached lines
			for (let i = toTranslate.length - 1; i >= 0; i--) {
				let cacheKey = getCacheKey(toTranslate[i]);
				if (this.cache.hasCache(cacheKey)) {
					translations[i] = this.cache.getCache(cacheKey);
					toTranslate.splice(i, 1);
				}
			}
			if (toTranslate.length !== translations.length) {
				this.log(
					`[RedTranslator] Skipped ${
						translations.length - toTranslate.length
					} sentences due to cache hits.`
				);
			}
		}
		/**
		 * Rules for the main wrapper class:
		 * "I don't care how the translation is done"
		 * "I don't care how many lines it can translate at once"
		 * "I just throw stuff around"
		 * If there is a need for delay, doTranslate should handle it.
		 * If there is a max length, doTranslate should handle it.
		 * Any calls for external servers, etc, doTranslate handles it.
		 */
		let result: TranslatorEngineResults = {
			sourceText: rows.join(),
			translationText: '',
			source: rows,
			translation: <Array<string>>[]
		};

		this.log(
			`[RedTranslator] Sending ${toTranslate.length} lines (processed from ${
				rows.length
			} rows) to ${this.getEngine().name}.`
		);
		let translatorPerformance = new RedPerformance();
		this.doTranslate(toTranslate, options)
			.then((translatedLines: Array<string>) => {
				// toTranslate matches translatedLines
				// translations matches initial translatableLines
				let outerIndex = 0;
				let innerIndex = 0;
				while (outerIndex < translatedLines.length) {
					while (translations[innerIndex] != undefined) {
						innerIndex++;
					}
					if (this.optionUseCache.getValue()) {
						if (translatedLines[outerIndex] !== undefined) {
							let cacheKey = getCacheKey(toTranslate[outerIndex]);
							this.cache.addCache(cacheKey, translatedLines[outerIndex]);
						}
					}
					translations[innerIndex++] = translatedLines[outerIndex++];
				}
				process.setTranslatedLines(...translations);

				let translatedRows = process.getTranslatedLines();

				process.getWarnings().forEach((warning) => {
					const startMessage = '[RedTranslator] Processor Warning: ';
					let pad = ' '.repeat(startMessage.length);
					this.error(
						[
							`${startMessage}${warning.message}`,
							`${pad}Original: ${warning.originalSentence}`,
							`${pad}Current: ${warning.currentSentence}`,
							`${pad}Placeholders: ${warning.placeholders}`
						].join('\n')
					);
				});

				result.translationText = translatedRows.join();
				result.translation = translatedRows;

				options.onAfterLoading(result);
			})
			.catch((reason: string) => {
				options.onError(reason);
			})
			.finally(() => {
                ui.hideBusyOverlay();
				let start = '[RedTranslator] ';
				let pad = ' '.repeat(start.length);
				this.log(`${start}Batch took: ${batchPerformance.end().getSeconds()} seconds.`);
				this.log(
					`${pad}Performance: ${
						Math.round(
							(10 * result.sourceText.length) / translatorPerformance.end().getSeconds()
						) / 10
					} characters per second. ${
						Math.round((10 * rows.length) / batchPerformance.getSeconds()) / 10
					} rows per second.`
				);
				if (this.optionCachePersistent.getValue()) {
					this.log('[RedTranslatorEngine] Saving translation cache to file.');
					this.cache.saveCache();
				}
				options.always();
			});
	}

	public abstract abort(): void;
	public abstract pause(): void;
	public abstract resume(): void;

	public getEngine() {
		return this.translatorEngine;
	}

	public getId() {
		return this.translatorEngine.id;
	}

	constructor(
		processorClass: typeof TextProcessor,
		thisAddon: Addon,
		extraOptions: Partial<TranslationEngineOptions>
	) {
		this.processor = new processorClass();

		this.translatorEngine = new TranslatorEngine({
			author: thisAddon.package.author.name,
			version: thisAddon.package.version,
			...extraOptions,
			optionsForm: {
				schema: {},
				form: []
			}
		});

		this.translatorEngine.optionsForm;

		this.translatorEngine.translate = (text: Array<string>, options: any) => {
			this.translate(text, options);
		};

		this.translatorEngine.abortTranslation = () => {
			this.abort();
		};
		this.translatorEngine.abort = this.translatorEngine.abortTranslation;

		this.translatorEngine.pause = () => {
			this.pause();
		};

		this.translatorEngine.resume = () => {
			this.resume();
		};

		// Listen for changes
		/* this.translatorEngine.on('update', (evt: Event, obj: { key: string; value: any }) => {
			let option = this.storedOptionsHash[obj.key];
			if (typeof option != 'undefined') {
				option.setValue(obj.value);
			}
            this.translatorEngine[obj.key] = obj.value;
		}); */
	}

	public init() {
		let options: TranslationEngineOptionForm = {
			form: [],
			schema: {}
		};

		this.storedOptions.sort((a, b) => {
			let ca = TranslationEngineOptionCategoriesPriority[a.getCategory()];
			let cb = TranslationEngineOptionCategoriesPriority[b.getCategory()];
			if (ca !== cb) {
				return ca - cb;
			} else {
				let pa = a.getPriority();
				let pb = b.getPriority();
				if (pa !== pb) {
					return pa - pb;
				} else {
					let na = a.getName().toLowerCase();
					let nb = b.getName().toLowerCase();
					return na < nb ? 1 : na > nb ? -1 : 0;
				}
			}
		});

		this.storedOptions.forEach((option) => {
			options.form.push({
				key: option.getId(),
				type: option.getFormType(),
				onChange: (evt: any) => {
					if (option.getType() == 'boolean') {
						let value = $(<HTMLInputElement>evt.target).prop('checked');
						option.setValue(value);
						this.translatorEngine.update(option.getId(), value);
					} else {
						let value = $(evt.target).val();
						option.setValue(value);
						this.translatorEngine.update(option.getId(), option.getValue());
					}
				},
				...option.getFormOptions()
			});

			options.schema[option.getId()] = {
				type: option.getType(),
				title: option.getName(),
				description: option.getDescription(),
				default: option.getDefault(),
				...option.getSchemaOptions()
			};

			this.translatorEngine[option.getId()] = option.getValue();

            if (option.getChildForm().length > 0) {
                option.getChildForm().forEach(childForm => {
                    options.form.push(childForm);
                });
            }
		});

		options.form.push({
			type: 'actions',
			title: 'Reset RegExps',
			fieldHtmlClass: 'actionButtonSet',
			items: [
				{
					type: 'button',
					title:
						'Reset settings to their default values (click then close options to apply)',
					onClick: (evt: any) => {
						this.storedOptions.forEach((option) => {
							try {
								// These don't work unfortunately. We'd need to reach the Ace Editor variable somehow. icba.
								//(<any> window).clicked = evt;
								//var $optionWindow = $((evt.target).parentNode.parentNode);
								//$optionWindow.find(`[name="${option.getId()}"]`).val(option.getDefault());
								option.setValue(option.getDefault());
							} catch (e) {}
						});
					}
				},
				{
					type: 'button',
					title:
						'Empty Cache (use if the translator is updated with better translations)',
					onClick: () => {
						this.cache.resetCache();
						this.cache.saveCache();
					}
				}
			]
		});

		this.translatorEngine.optionsForm = options;

		this.translatorEngine.init();
	}

	protected storedOptions: TranslationEngineOption<any>[] = [];
	protected storedOptionsHash: { [id: string]: TranslationEngineOption<any> } = {};

	public addOption(option: TranslationEngineOption<any>) {
		this.storedOptions.push(option);
		this.storedOptionsHash[option.getId()] = option;
	}

	public getPatterns(str: string): TextProcessorPattern[] {
		try {
			let arr = eval('[\n' + str + '\n]');
			return arr;
		} catch (e) {
			console.error('Failed to parse patterns:', str, e);
			return [];
		}
	}

	public getProcessingOrder() {
		// 'BREAK,ISOLATE,CUT,SPLIT,ESCAPE'
		const namesToType: { [id: string]: TextProcessorOrderType } = {
			break: TextProcessorOrderType.BREAK_LINES,
			isolate: TextProcessorOrderType.ISOLATE_SENTENCES,
			escape: TextProcessorOrderType.ESCAPE_SYMBOLS,
			cut: TextProcessorOrderType.CUT_CORNERS,
			split: TextProcessorOrderType.AGGRESSIVE_SPLITTING
		};

		let orderStringArray = this.optionProcessingOrder
			.getValue()
			.toLowerCase()
			.replaceAll(/[\.,;\/\|\\]/g, ',')
			.split(',');
		let order: Array<TextProcessorOrderType> = [];
		orderStringArray.forEach((orderString) => {
			let type = namesToType[orderString];
			if (type !== undefined) {
				order.push(type);
			} else {
				console.error("Can't find process type: " + orderString);
			}
		});
		return order;
	}

	public processorInit() {
		this.processor.setOptions({
			placeholderRecoveryType: this.optionPlaceholderRecoveryType.getValue(),
			protectedPatternsPad: this.optionPadPlaceholder.getValue(),
			aggressiveSplittingPatterns: this.getPatterns(
				this.optionSplittingPatterns.getValue()
			),
			aggressiveSplittingTranslatable: false,
			agressiveSplittingNext: false,
			placeholderType: this.optionPlaceholderType.getValue(),
			noRepeat: true,
			mergeSequentialPlaceholders: true,
			maintainScripts: true,
			recoverPadding: true,
			trim: true,
			trimLines: true,
			protectedPatterns: this.getPatterns(this.optionProtectedPatterns.getValue()),
			processingOrder: this.getProcessingOrder(),
			isolateSymbolsPatterns: this.getPatterns(this.optionIsolatePatterns.getValue()),
			lineBreakPatterns: this.getPatterns(this.optionBreakPatterns.getValue()),
			lineBreakReplacement: '\n',
			protectCornersPatterns: this.getPatterns(this.optionSplitEndsPatterns.getValue())
		});
	}

	public log(...texts: Array<string>) {
		let elements: Array<Text> = [];
		texts.forEach((text) => {
			elements.push(document.createTextNode(text));
		});
		this.print(...elements);
	}

	public error(...texts: Array<string>) {
		let elements: Array<Text> = [];
		texts.forEach((text) => {
			elements.push(document.createTextNode(text));
		});
		this.printError(...elements);
	}

	public print(...elements: Array<Element | Text>) {
		let consoleWindow = $('#loadingOverlay .console')[0];
		let pre = document.createElement('pre');
		pre.style.whiteSpace = 'pre-wrap';
		elements.forEach((element) => {
			pre.appendChild(element);
		});
		consoleWindow.appendChild(pre);
	}

	public printError(...elements: Array<Element | Text>) {
		let consoleWindow = $('#loadingOverlay .console')[0];
		let pre = document.createElement('pre');
		pre.style.color = '#ff7b7b';
		pre.style.fontWeight = 'bold';
		pre.style.whiteSpace = 'pre-wrap';
		elements.forEach((element) => {
			pre.appendChild(element);
		});
		consoleWindow.appendChild(pre);
	}

	/**
	 *
	 *
	 * OPTIONS
	 *
	 *
	 */
	public optionPlaceholderType = new TranslationEngineOption<PlaceholderType>({
		wrapper: this,
		id: 'placeholderType',
		default: PlaceholderType.mvStyleLetter,
		category: TranslationEngineOptionCategories.OPTIONS,
		priority: -2,
		name: 'Placeholder Type',
		description: [
			'Protected patterns will be replaced by a symbol from this list before translation.',
			'The ideal type depends on the translator being used. Sugoi Translator works pretty well with MV Letter Style / %A. Google has some innate support for HTML Tags and '
		].join('\n'),
		formType: 'select',
		schemaOptions: {
			enum: Object.values(PlaceholderType)
		},
		formOptions: {
			titleMap: { ...PlaceholderTypeNames }
		}
	});

	public optionPlaceholderRecoveryType =
		new TranslationEngineOption<PlaceholderRecoveryType>({
			wrapper: this,
			id: 'placeholderRecoveryType',
			default: PlaceholderRecoveryType.GUESS,
			category: TranslationEngineOptionCategories.OPTIONS,
			priority: -1.5,
			name: 'Placeholder Recovery type',
			description: [
				"Defines how to proceed when the placeholder can't be found for recovery.",
				"\"Guess\" means placing it at the space nearest to the position on the original string, and is the recommended setting. With any option except Throw Away, Placeholders will not be lost in translation. The upside is that you won't be losing text, the downside is that a sentence which lost its placeholders will be corrupted in some way - but that's hardly a real downside, given that it's even more corrupted without the placeholder recovery process."
			].join('\n'),
			formType: 'select',
			schemaOptions: {
				enum: [
					PlaceholderRecoveryType.ADD_AT_END,
					PlaceholderRecoveryType.ADD_AT_START,
					PlaceholderRecoveryType.GUESS,
					PlaceholderRecoveryType.PERFECT_ONLY
				]
			},
			formOptions: {
				titleMap: {
					[PlaceholderRecoveryType.ADD_AT_END]: 'Insert unrecoverable placeholder at end',
					[PlaceholderRecoveryType.ADD_AT_START]:
						'Insert unrecoverable placeholder at the start',
					[PlaceholderRecoveryType.PERFECT_ONLY]: 'Throw away unrecoverable placeholders',
					[PlaceholderRecoveryType.GUESS]: 'Guess'
				}
			}
		});

	public optionProcessingOrder = new TranslationEngineOption<string>({
		wrapper: this,
		id: 'processingOrder',
		default: 'BREAK,ISOLATE,CUT,SPLIT,ESCAPE',
		description: [
			'The order in which the text processor goes through sentences. The same process can be done more than once, and function patterns can activate themselves on only a certain pass.',
			'The default order, as well as the names, are: BREAK,ISOLATE,CUT,SPLIT,ESCAPE',
			'Break is the process of separating sentences out of rows. Isolate is the process of finding inner sequences inside sentences and translating them separatedly. Cut is the process of removing symbols from the corners of each translatable sequence. Split is the process of further dividing sentences into smaller translatable parts. Escape is the process of replacing protected patterns with placeholders.',
			"It is not mandatory to have every process. In fact, you can have none. But by then you're not taking advantage of the text processor. Invalid inputs will be ignored - an error will be printed to the developer console (F12) in those cases."
		].join('\n'),
		name: 'Processing Order',
		category: TranslationEngineOptionCategories.OPTIONS,
		priority: -1
	});

	/* public optionUseProtectedPatterns = new TranslationEngineOption<boolean>({
		wrapper: this,
		id: 'useProtectedPatterns',
		default: true,
		description:    'Protects patterns by replacing them with placeholders.\n' + 
                        'It\'s important to select a Placeholder Type that works well with your translator. Sugoi works pretty well with MV-Style (%A). Google and DeepL have some innate support for both HTML Tags and Curly Brackets.\n' +
                        'The main idea of the placeholder is to protect something that you don\'t want the translator to touch while still giving the translator the contextual cue of a symbol.',
		name: 'Protect Patterns',
		category: TranslationEngineOptionCategories.OPTIONS
	});

	public optionUseSplittingTranslatable = new TranslationEngineOption<boolean>({
		wrapper: this,
		id: 'useSplittingTranslatable',
		default: false,
        name : 'Translate Splits',
		description:    'Normally, splits are not sent to the translator, but they split the sentence in two.\nThis changes the behavior so that splits are also translated.',
		category: TranslationEngineOptionCategories.OPTIONS,
        priority : 11
	});

	public optionUseSplittingNext = new TranslationEngineOption<boolean>({
		wrapper: this,
		id: 'useSplittingNext',
		default: false,
		name:    'Start Sentence with Split',
		description: 'Split Patterns are added to the next sentence rather than the previous one.\nOnly in effect if "Splits are Translatable" is checked.',
		category: TranslationEngineOptionCategories.OPTIONS,
        priority : 12
	}); */

	/* public optionUseProtectedCorners = new TranslationEngineOption<boolean>({
		wrapper: this,
		id: 'useProtectedCorners',
		default: true,
		description:
			'Removes patterns from the corners of sentences, not sending those to the translator.',
		name: 'Split Ends',
		category: TranslationEngineOptionCategories.OPTIONS
	}); */

	public optionPadPlaceholder: TranslationEngineOption<boolean> =
		new TranslationEngineOption<boolean>({
			wrapper: this,
			id: 'padPlaceholder',
			default: false,
			description:
				'Adds white space around placeholders.\nThis is very useful if translating from a language that shares characters with the placeholders. e.g. instead of text%Atext it will send the translator text %A text, which is clearer.\nIn a way, the downside to this is that the end result might end up with more spaces than it should have, so a very minor downside, but a downside nonetheless.',
			name: 'Pad Placeholders',
			category: TranslationEngineOptionCategories.OPTIONS,
			priority: 0
		});

	public optionUseCache: TranslationEngineOption<boolean> =
		new TranslationEngineOption<boolean>({
			wrapper: this,
			id: 'useCache',
			default: true,
			description:
				'Stores translations in memory to avoid repeating work.\nThis only matches exact sentences, so there is no downside for this - no losses, only speed gains.',
			name: 'Cache',
			category: TranslationEngineOptionCategories.OPTIONS,
			priority: 499
		});

	public optionCachePersistent: TranslationEngineOption<boolean> =
		new TranslationEngineOption<boolean>({
			wrapper: this,
			id: 'useCachePersistent',
			default: true,
			description:
				'Saves cache to a file so that it can be used through multiple sessions.\nThere is no downside to having this on.',
			name: 'Persistent Cache',
			category: TranslationEngineOptionCategories.OPTIONS,
			priority: 500
		});

	public optionCachePersistentSize: TranslationEngineOption<number> =
		new TranslationEngineOption<number>({
			wrapper: this,
			id: 'cachePersistentSize',
			default: 10,
			description:
				"The maximum size, in megabytes, that the cache can reach.\nThe value is used as an approximation. It is recommended to use a value that won't cause issues with regards to either memory or disk speed.\nFor reference: a small game will usually fill about 500KB of cache, a medium game will fill about 1MB of cache, and a large game might fill 2MB of cache. So the default value of 10MB is about 5 big games worth of cache.",
			name: 'Persistent Cache Size',
			category: TranslationEngineOptionCategories.OPTIONS,
			priority: 501
		});

	/**
	 * Limits
	 */
	public optionMaxRequestLength = new TranslationEngineOption<number>({
		category: TranslationEngineOptionCategories.LIMITS,
		id: 'maxRequestLength',
		name: 'Maximum Batch Size',
		description:
			'The amount of characters that each batch will have under batch translations. Higher numbers are faster, but smaller numbers are safer - specially if saving project between each batch. Recommended value is what you should get translated in 10-30 secs, for minimal loss of work in case of errors/failure.',
		default: 5000,
		priority: 1,
		wrapper: this
	});

	/**
	 *
	 *
	 * PATTERNS
	 *
	 *
	 */
	public optionProtectedPatterns = new TranslationEngineOption<string>({
		wrapper: this,
		id: 'protectedPatterns',
		default: [
			'// For reference, we are trying to remove most things through isolation + cutting corners, so the patterns are mostly for what gets through',
			'// Value reference',
			/[\\]*[_\-a-z]+\[[^\[\]]+?\]/gi.toString() + ',',
			'// RPG Maker conditional choice',
			/(\s*((if)|(en))\(.+?\)\s*)/gi.toString() + ','
		].join('\n'),
		description:
			'Protected Patterns will replace every match with a placeholder. The placeholder will be replaced by the original value after translation.\n' +
			PatternExplanation +
			'\nTo disable, you can comment out every pattern or leave it empty.',
		name: 'Protected Patterns',
		formType: 'ace',
		category: TranslationEngineOptionCategories.PATTERNS,
		formOptions: {
			aceMode: 'javascript',
			aceTheme: 'twilight',
			height: '150px'
		}
	});

	public optionSplittingPatterns = new TranslationEngineOption<string>({
		wrapper: this,
		id: 'splittingPatterns',
		default: [].join('\n'),
		description:
			'Splits sentences according to patterns.' +
			"\nSplitting is very similar to Protected Patterns - they match a pattern and protect it. Generally no benefit in using except in certain projects. You'll know it when you see it." +
			'\nThere are two differences: the first is that splitting leaves nothing to chance - the original position of the matched pattern, its contents, everything will be separated and not even sent to the translator at all.' +
			"\nThe second difference is that the sentence will be split (as the name implies) every time a pattern appears. So while this guarantees the pattern will absolutely be protected, the translator might miss out on contextual cues. This is best used for text that can't be translated (script calls, etc) or something that must survive the translation process no matter what." +
			'\nSplitting out untranslatable symbols that are not related to the sentence improves translation quality and speed with no downsides.' +
			PatternExplanation,
		name: 'Aggressive Splitting',
		category: TranslationEngineOptionCategories.PATTERNS,
		priority: 1,
		formType: 'ace',
		formOptions: {
			aceMode: 'javascript',
			aceTheme: 'twilight',
			height: '75px'
		}
	});

	public optionBreakPatterns = new TranslationEngineOption<string>({
		wrapper: this,
		id: 'linebreakPatterns',
		default: [
			'// Blank lines',
			/\s*\r?\n\s*\r?\n/g.toString() + ',',
			'// Current sentence ended with punctuation',
			/(?<=[─ー～~ｰ\-\\<>\|\/！？。・…‥：；.?!;:\]\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩"'`´◆◎★■☆〇□△●♂♀⚤⚢⚨⚣⚩⚧⸸✞☦✝✟♱☥♁✙⚰️⛧♡♥❤♦♣♠•◘○◙♂♀♪♫►◄▲▼↑←↑→↓↓→←↔※＊〽〓♪♫♬♩〇〒〶〠〄ⓍⓁⓎ<>\-\+=])(\s*\r?\n)/g.toString() +
				',',
			'// Next sentence starts with a symbol/opener/punctuaction for some reason',
			/(\r?\n\s*)(?=[─ー～~ｰ\-\\<>\|\/！？。・…‥：；.?!;:〔〖〘〚〝｢〈《「『【（［\[\({＜<｛｟"'´`◆◎★■☆〇□△●♂♀⚤⚢⚨⚣⚩⚧⸸✞☦✝✟♱☥♁✙⚰️⛧♡♥❤♦♣♠•◘○◙♂♀♪♫►◄▲▼↑←↑→↓↓→←↔※＊〽〓♪♫♬♩〇〒〶〠〄ⓍⓁⓎ<>\-\+=])/g.toString() +
				','
		].join('\n'),
		description:
			'The core of Red Text Processor. Separates sentences according to when it looks like the previous sentence ended, sending them to the translator separatedly.\n' +
			'\nThe default rules are pretty solid, but feel free to change them. The behavior of these patterns is that whatever matches them will be removed and replaced by a simple line break.' +
			PatternExplanation,
		name: 'Line Break Patterns',
		category: TranslationEngineOptionCategories.PATTERNS,
		priority: 2,
		formType: 'ace',
		formOptions: {
			aceMode: 'javascript',
			aceTheme: 'twilight',
			height: '100px'
		}
	});
	public optionIsolatePatterns = new TranslationEngineOption<string>({
		wrapper: this,
		id: 'isolatePatterns',
		default: [
			'// Names',
			/\\nw?[<\[].+?[\]>]/gi.toString() + ',',
			'// Isolate SG Quest Scripts',
			/<SG.+?>/gi.toString() + ',',
			'// Isolate colored text',
			/\\C\[.+?\].+?\\C\[.+?\]/gi.toString() + ',',
			'// Isolate SG Quest Scripts',
			/<SG.+?>/gi.toString() + ',',
			'// Carefully isolate quotes, except the ones that look like script',
			/((?<![A-Z])((\[[^\[]+\])|(\([^\(]+\))))/gi.toString() + ',',
			'// Isolates matching quoted text',
			...isolationGroupsRegExp
		].join('\n'),
		description:
			'This finds text inside brackets and translates it separatedly.\n' +
			"The entire match will be isolated. This is best when paired with Cutting Corners patterns which also remove the boundary symbols - the translator doesn't benefit from seeing the quotes or brackets." +
			PatternExplanation,
		name: 'Isolation Patterns',
		category: TranslationEngineOptionCategories.PATTERNS,
		priority: 4,
		formType: 'ace',
		formOptions: {
			aceMode: 'javascript',
			aceTheme: 'twilight',
			height: '100px'
		}
	});

	public optionSplitEndsPatterns = new TranslationEngineOption<string>({
		wrapper: this,
		id: 'splitEndsPatterns',
		default: [
			"// Pure english, uncomment for sources that don't use english characters",
			'//' + /^[\x21-\x7E\* ]+$/g.toString() + ',',
			'// Comment?',
			/\/\/.+?$/g.toString() + ',',
			'// Untranslatable SG Quests',
			/^<SG((手動)|(カテゴリ)|(ピクチャ))[\s\S]*?>/gi.toString() + ',',
			/^<Category:.+?>/gi.toString() + ',',
			'// Translatable SG Quest',
			/^<SG.+?:/gi.toString() + ',',
			'// Names',
			/^\\n</g.toString() + ',',
			/\\nw\[/gi.toString() + ',',
			'// Colors at corners',
			/(^\\C\[.+?\])|\\C\[.+?\]$/gi.toString() + ',',
			'// Common script calls',
			/(^D_TEXT )|(^DW_[A-Z]+ )|(^addLog )|(^ShowInfo )|(^text_indicator :)|(^.+?subject=)/g.toString() +
				',',
            "// First we grab the arguments portion of a info: call, then we grab the info itself, leaving only the text",
            /^info:.+?\K(,\d+)+$/gi.toString() + ',',
            /^info:/gi.toString() + ',',
			'// Game Specific',
			/\s*\\\^\s*$/g.toString() + ',',
			/^\\>\s*(\s*\\C\[\d+?\]\s*)*/gi.toString() + ',',
			'// Conditional choice RPG Maker at the end',
			/\s*((if)|(en))\(.+?\)\s*$/gi.toString() + ',',
			'// Conditional choice RPG Maker at the start',
			/^\s*((if)|(en))\(.+?\)\s*/gi.toString() + ',',
			'// Brackets at start',
			/^\s*[〔〖〘〚〝｢〈《「『【（［\[\({＜<｛｟"'´`]+/g.toString() + ',',
			'// Brackets at end',
			/[\]\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩"'`´]+\s*$/g.toString() + ',',
			'// Symbols at start',
			/(^\s*[ー～~─ｰ\-\\<>\/\|\\◆◎★■☆〇□△●♂♀⚤⚢⚨⚣⚩⚧⸸✞☦✝✟♱☥♁✙⚰️⛧♡♥❤♦♣♠•◘○◙♂♀♪♫►◄▲▼↑←↑→↓↓→←↔※＊〽〓♪♫♬♩〇〒〶〠〄ⓍⓁⓎ<>\-\+=]+)/g.toString() +
				',',
			'// Symbols at end',
			/([ー～~─ｰ\-\\<>\/\|\\◆◎★■☆〇□△●♂♀⚤⚢⚨⚣⚩⚧⸸✞☦✝✟♱☥♁✙⚰️⛧♡♥❤♦♣♠•◘○◙♂♀♪♫►◄▲▼↑←↑→↓↓→←↔※＊〽〓♪♫♬♩〇〒〶〠〄ⓍⓁⓎ<>\-\+=]+\s*$)/g.toString() +
				','
		].join('\n'),
		description:
			'These are to be used to match against text at either the start or the end of sentences. It works kind of like splitting - the matched symbol will be removed from the sentence before translation and added back later.\n' +
			'This is best used to remove symbols which offer no benefit to the translation process (like brackets or quotes), or to protect script calls.' +
			PatternExplanation,
		name: 'Cutting Corners Patterns',
		category: TranslationEngineOptionCategories.PATTERNS,
		priority: 5,
		formType: 'ace',
		formOptions: {
			aceMode: 'javascript',
			aceTheme: 'twilight',
			height: '150px'
		}
	});
}
