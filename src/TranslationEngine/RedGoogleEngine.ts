import { TranslationEngineOption } from './TranslationEngineOption';
import {
	TranslationEngineOptionCategories,
	TranslationEngineWrapper
} from './TranslationEngineWrapper';
import type { TextProcessor } from 'mtl-text-processor';

export class RedGoogleEngine extends TranslationEngineWrapper {
	protected aborted: boolean = false;
	protected paused: boolean = false;
	protected pauseQueue: Array<Function> = [];

	protected lastRequest: number = 0;

	public constructor(processor: typeof TextProcessor, thisAddon: Addon) {
		super(processor, thisAddon, {
			id: 'redgoogles',
			name: 'Red Google Translator',
			languages: {
				af: 'Afrikaans',
				sq: 'Albanian',
				am: 'Amharic',
				ar: 'Arabic',
				hy: 'Armenian',
				az: 'Azerbaijani',
				eu: 'Basque',
				be: 'Belarusian',
				bn: 'Bengali',
				bs: 'Bosnian',
				bg: 'Bulgarian',
				ca: 'Catalan',
				ceb: 'Cebuano',
				'zh-CN': 'Chinese (Simplified)',
				'zh-TW': 'Chinese (Traditional)',
				co: 'Corsican',
				hr: 'Croatian',
				cs: 'Czech',
				da: 'Danish',
				nl: 'Dutch',
				en: 'English',
				eo: 'Esperanto',
				et: 'Estonian',
				fi: 'Finnish',
				fr: 'French',
				fy: 'Frisian',
				gl: 'Galician',
				ka: 'Georgian',
				de: 'German',
				el: 'Greek',
				gu: 'Gujarati',
				ht: 'Haitian Creole',
				ha: 'Hausa',
				haw: 'Hawaiian',
				he: 'Hebrew',
				hi: 'Hindi',
				hmn: 'Hmong',
				hu: 'Hungarian',
				is: 'Icelandic',
				ig: 'Igbo',
				id: 'Indonesian',
				ga: 'Irish',
				it: 'Italian',
				ja: 'Japanese',
				jw: 'Javanese',
				kn: 'Kannada',
				kk: 'Kazakh',
				km: 'Khmer',
				ko: 'Korean',
				ku: 'Kurdish',
				ky: 'Kyrgyz',
				lo: 'Lao',
				la: 'Latin',
				lv: 'Latvian',
				lt: 'Lithuanian',
				lb: 'Luxembourgish',
				mk: 'Macedonian',
				mg: 'Malagasy',
				ms: 'Malay',
				ml: 'Malayalam',
				mt: 'Maltese',
				mi: 'Maori',
				mr: 'Marathi',
				mn: 'Mongolian',
				my: 'Myanmar (Burmese)',
				ne: 'Nepali',
				no: 'Norwegian',
				ny: 'Nyanja (Chichewa)',
				ps: 'Pashto',
				fa: 'Persian',
				pl: 'Polish',
				pt: 'Portuguese (Portugal, Brazil)',
				pa: 'Punjabi',
				ro: 'Romanian',
				ru: 'Russian',
				sm: 'Samoan',
				gd: 'Scots Gaelic',
				sr: 'Serbian',
				st: 'Sesotho',
				sn: 'Shona',
				sd: 'Sindhi',
				si: 'Sinhala (Sinhalese)',
				sk: 'Slovak',
				sl: 'Slovenian',
				so: 'Somali',
				es: 'Spanish',
				su: 'Sundanese',
				sw: 'Swahili',
				sv: 'Swedish',
				tl: 'Tagalog (Filipino)',
				tg: 'Tajik',
				ta: 'Tamil',
				te: 'Telugu',
				th: 'Thai',
				tr: 'Turkish',
				uk: 'Ukrainian',
				ur: 'Urdu',
				uz: 'Uzbek',
				vi: 'Vietnamese',
				cy: 'Welsh',
				xh: 'Xhosa',
				yi: 'Yiddish',
				yo: 'Yoruba',
				zu: 'Zulu'
			},
			batchDelay: 1,
			description:
				'Google Translator using the same Text Processor as Red Sugoi.\nDo note that the settings are kept separate, so you can have different patterns bewtween them.',
			mode: 'rowByRow'
		});
	}

	public doTranslate(
		toTranslate: string[],
		options: TranslatorEngineOptions
	): Promise<string[]> {
		this.resetStatus();
		let returnTranslations: (translations: Array<string>) => void;
		let returnError: (reason: string) => void;

		let translations: string[] = new Array(toTranslate.length);
		let translatingIndex = 0;
		let completeThreads = 0;

		let maximumBatchSize = this.optionMaxLength.getValue();

		let complete = () => {
			returnTranslations(translations);
		};

		let translationProgress = document.createTextNode('0');
		let translatedCount = 0;
		let errorProgress = document.createTextNode('');
		let errorCount = 0;
		let statusProgress = document.createTextNode('Starting up!');

		this.print(
			document.createTextNode('[RedGoogle] Translating texts: '),
			translationProgress,
			document.createTextNode('/' + toTranslate.length),
			errorProgress,
			document.createTextNode(' - Current Status: '),
			statusProgress
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

		let startThread = () => {
			if (this.aborted) {
				returnError('Aborted.');
				startThread = () => {};
				return;
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
				let sendToGoogle = () => {
					statusProgress.nodeValue = 'Sending to Google!';

					let rowSeparator = this.optionLineDelimiter.getValue();

					(<(...any: Array<any>) => Promise<any>>common.fetch)(
						this.optionUrl.getValue(),
						{
							method: 'get',
							data: {
								client: 'gtx',
								sl: options.sl,
								tl: options.tl,
								dt: 't',
								q: batch.join('\n' + rowSeparator)
							}
							//headers		: { 'Content-Type': 'application/json' },
						}
					)
						.then((data) => {
							statusProgress.nodeValue = 'Reading response...';
							let googleTranslations = data[0]; // Each line becomes a translation...
							let uglyTranslations = [];
							for (let i = 0; i < googleTranslations.length; i++) {
								uglyTranslations.push(googleTranslations[i][0]);
							}
							let cleanTranslations: string = uglyTranslations.join('\n');

							// Google doesn't destroy tags, but it adds spaces... "valid HTML" I guess.
							cleanTranslations = cleanTranslations.replaceAll(/ *< */g, '<');
							cleanTranslations = cleanTranslations.replaceAll(/ *> */g, '>');

							// Fuck empty lines
							cleanTranslations = cleanTranslations.replaceAll(/[\n]{2,}/g, '\n');

							// Fuck spaces at the end of lines
							cleanTranslations = cleanTranslations.replaceAll(/ *\n/g, '\n');

							// Case consistency
							cleanTranslations = cleanTranslations.replaceAll(
								new RegExp(rowSeparator, 'gi'),
								rowSeparator
							);

							// we want to ignore line breaks on the sides of the row separator
							cleanTranslations = cleanTranslations.replaceAll(
								'\n' + rowSeparator,
								rowSeparator
							);
							cleanTranslations = cleanTranslations.replaceAll(
								rowSeparator + '\n',
								rowSeparator
							);

							// Japanese loves repeating sentence enders !!!
							// Google does not
							cleanTranslations = cleanTranslations.replaceAll(/\n!/g, '!');
							cleanTranslations = cleanTranslations.replaceAll(/\n\?/g, '?');
							cleanTranslations = cleanTranslations.replaceAll(/\n\./g, '.');
							cleanTranslations = cleanTranslations.replaceAll(/\n;/g, ';');

							let pristineTranslations = cleanTranslations.split(rowSeparator);
							if (pristineTranslations.length != batch.length) {
								updateErrorCount(batch.length);
								this.error(
									`[RedGoogle] A batch broke due to mismatch. We sent ${batch.length} sentences and got ${pristineTranslations.length} back. Skipping them. You can find more details in the dev console (F12).`
								);
								console.warn('[RedGoogle]', {
									batch: batch,
									received: data[0],
									pristine: pristineTranslations
								});
								console.error(
									'[RedGoogle] Our ' +
										rowSeparator +
										' should be in there somewhere, changed in some way. Perhaps we need a different one?'
								);
							} else {
								for (let i = 0; i < pristineTranslations.length; i++) {
									translations[batchIndexes[i]] = pristineTranslations[i].trim(); // Google loves spaces...
								}
								updateTranslatedCount(batch.length);
							}
						})
						.catch((e) => {
							statusProgress.nodeValue = 'DOH!';
							this.error(
								'[Red Google] Error on fetch: ' + e.message + '. Skipping batch.'
							);
						})
						.finally(() => {
							this.lastRequest = Date.now();
							startThread();
						});
				};

				let now = Date.now();
				if (now - this.lastRequest > this.optionInnerDelay.getValue()) {
					this.lastRequest = now;
					sendToGoogle();
				} else {
					statusProgress.nodeValue = 'Waiting inner delay...';
					setTimeout(
						sendToGoogle,
						this.optionInnerDelay.getValue() - (now - this.lastRequest)
					);
				}
			}
		};

		return new Promise((resolve, reject) => {
			returnTranslations = resolve;
			returnError = reject;
			startThread();
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

	public optionUrl: TranslationEngineOption<string> = new TranslationEngineOption<string>(
		{
			wrapper: this,
			id: 'urls',
			default: 'https://translate.google.com/translate_a/single',
			description: "URL for Google's translation server. Hopefully never to be changed.",
			name: 'Target URL',
			category: TranslationEngineOptionCategories.LIMITS,
			priority: -10
		}
	);

	/**
	 * Limits
	 */
	public optionMaxLength: TranslationEngineOption<number> =
		new TranslationEngineOption<number>({
			wrapper: this,
			id: 'maxTranslationLength',
			default: 800,
			description: [
				'Maximum amount of characters that will be sent per server request.',
				'If you send too many, Google will just reject your request.',
				"Note: if an atomic string (that can't be split) is larger than this amount, it will still be sent in full, but it will be sent alone."
			].join('\n'),
			name: 'Request Character Limit',
			category: TranslationEngineOptionCategories.LIMITS,
			priority: -9
		});

	public optionInnerDelay: TranslationEngineOption<number> =
		new TranslationEngineOption<number>({
			wrapper: this,
			id: 'innerDelay',
			default: 6000,
			description:
				'The amount of time (in milliseconds) to wait between requests. The longer this is, the less likely you are to be blocked by Google. Numbers lower than 6 seconds tend to cause a ban after just a few translations.',
			name: 'Inner Delay',
			category: TranslationEngineOptionCategories.LIMITS,
			priority: -8
		});

	public optionLineDelimiter: TranslationEngineOption<string> =
		new TranslationEngineOption<string>({
			wrapper: this,
			id: 'googleLineDelimiter',
			default: '<tr>',
			description:
				"Google only accepts a single input, but we're translating many texts. So we have to mark when one text ends and another begins. It doesn't matter what this value is, so long as it is something Google will not touch or move. Google likes HTML tags.",
			name: 'Line Delimiter',
			category: TranslationEngineOptionCategories.OPTIONS,
			priority: -10
		});
}
