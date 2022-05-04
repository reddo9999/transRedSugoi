import { TranslationEngineOption } from './TranslationEngineOption';
import {
	TranslationEngineOptionCategories,
	TranslationEngineWrapper
} from './TranslationEngineWrapper';
import type { TextProcessor } from 'mtl-text-processor';

export class PiggybackEngine extends TranslationEngineWrapper {
	protected aborted: boolean = false;
	protected paused: boolean = false;
	protected pauseQueue: Array<Function> = [];

	protected lastRequest: number = 0;

	public constructor(processor: typeof TextProcessor, thisAddon: Addon) {
		super(processor, thisAddon, {
			id: 'redpiggy',
			name: 'Red Piggyback Translator',
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
				'Attempts to apply Text Processor to any translator you might have.',
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

        let engine : TranslatorEngine = trans[this.optionTranslator.getValue()];
		let maximumBatchSize = engine.maxRequestLength === undefined ? 500 : engine.maxRequestLength;
        let innerDelay = engine.batchDelay;

		let complete = () => {
			returnTranslations(translations);
		};

		let translationProgress = document.createTextNode('0');
		let translatedCount = 0;
		let errorProgress = document.createTextNode('');
		let errorCount = 0;
		let statusProgress = document.createTextNode('Starting up!');

		this.print(
			document.createTextNode('[RedPiggy] Translating texts (' + engine.name + '): '),
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
				let sendToTranslator = () => {
					statusProgress.nodeValue = 'Sending to translator!';

                    let always = () => {
                        always = () => {};
                        this.lastRequest = Date.now();
                        startThread();
                    }
                    
                    engine.translate(batch, <TranslatorEngineOptions> {
                        onAfterLoading : (result) => {
                            if (result.translation.length != batch.length) {
								updateErrorCount(batch.length);
								this.error(
									`[RedPiggy] A batch broke due to mismatch. We sent ${batch.length} sentences and got ${result.translation.length} back. Skipping them. You can find more details in the dev console (F12).`
								);
								console.warn('[RedPiggy]', {
									batch: batch,
									received: result.translations
								});
							} else {
								for (let i = 0; i < result.translation.length; i++) {
									translations[batchIndexes[i]] = result.translation[i];
								}
								updateTranslatedCount(batch.length);
							}
                            always();
                        },
                        onError : (reason) => {
                            statusProgress.nodeValue = 'DOH!';
							this.error(
								'[Red Piggy] Error on fetch: ' + reason + '. Skipping batch.'
							);
                        },
                        always : always
                    });
                };

				let now = Date.now();
				if (now - this.lastRequest > innerDelay) {
					this.lastRequest = now;
					sendToTranslator();
				} else {
					statusProgress.nodeValue = 'Waiting inner delay...';
					setTimeout(
						sendToTranslator,
						innerDelay - (now - this.lastRequest)
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

	public optionTranslator: TranslationEngineOption<string> = new TranslationEngineOption<string>(
		{
			wrapper: this,
			id: 'chosenTranslator',
			default: 'deepl',
			description: "Which translator is used",
			name: 'Target Translator',
			category: TranslationEngineOptionCategories.OPTIONS,
			priority: -1000,
            formType: 'select',
            schemaOptions: {
                enum: Object.values(trans.translator).filter(a => { return a.indexOf("red") != 0; }).sort()
            },
            formOptions: {
                titleMap: { 
                    ...(() => {
                        let names : {[id : string] : string} = {};
                        let ids = Object.values(trans.translator).filter(a => { return a.indexOf("red") != 0; }).sort();
                        ids.forEach(id => {
                            names[id] = trans[id].name;
                        });
                        return names;
                    })()
                }
            }
		}
	);
}
