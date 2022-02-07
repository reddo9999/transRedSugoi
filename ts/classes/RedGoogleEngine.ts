/// <reference path="RedTranslatorEngine.ts" />

class RedGoogleEngine extends RedTranslatorEngineWrapper {
    
    public doTranslate (toTranslate: string[], options: TranslatorEngineOptions): Promise<Array<string>> {
        let batchStartTime = new Date().getTime();
        let sourceLanguage = trans.getSl();
        let destinationLanguage = trans.getTl();

        let translating = 0;
        let translations = new Array(toTranslate.length);
        let maxBatchSize = (<any> this.getEngine()).maximumBatchSize;
        let delay = (<any> this.getEngine()).innerDelay;
        //let rowSeparator = "<newrowmarker>";
        let rowSeparator = (<any> this.getEngine()).lineSubstitute;
        //let rowSeparator = String.fromCodePoint(983040); // Cool in theory, not that cool in practice

        let progressCurrent = document.createTextNode("0");
        let progressTotal = document.createTextNode("/" + toTranslate.length);
        let currentAction = document.createTextNode("Starting up...")

        this.print(
            document.createTextNode("[Red Google] Translating current batch: "),
            progressCurrent,
            progressTotal,
            document.createTextNode(" - "),
            currentAction
        );

        let batchStart = 0;

        let translate = (onSuccess : (translated : Array<string>) => void, onError : (reason : string) => void) => {
            if (translating >= toTranslate.length) {
                currentAction.nodeValue = "Done!";
                let batchEnd = new Date().getTime();
                let seconds = Math.round((batchEnd - batchStartTime)/100)/10;
                this.log(`[RedGoogle] Batch took: ${seconds} seconds, which was about ${Math.round(10 * toTranslate.join("").length / seconds)/10} characters per second!`);
                this.log(`[RedGoogle] We skipped ${this.getCacheHits()} translations through cache hits!`);
                return onSuccess(translations);
            }
            currentAction.nodeValue = "Gathering strings...";
            let batch : Array<string> = [];
            let batchSize = 0;
            batchStart = translating;

            let calcBatchSize = (addition : string) => {
                return addition.length + batchSize + (rowSeparator.length * batch.length);
            }

            // If for some reason we get one huge ass translation, we send it alone
            while (translating < toTranslate.length && (batchSize == 0 || maxBatchSize > calcBatchSize(toTranslate[translating]))) {
                batch.push(toTranslate[translating]);
                batchSize += toTranslate[translating++].length;
            }

            let action = () => {
                sendToGoogle(batch, onSuccess, onError);
            };

            currentAction.nodeValue = "Waiting inner delay...";
            this.delay(action);
        }

        let sendToGoogle = (batch : Array<string>, onSuccess : (translated : Array<string>) => void, onError : (reason : string) => void) => {
            currentAction.nodeValue = "Sending to Google...";
            console.log("[RedGoogle] Batch: ", batch);
            (<(...any:Array<any>) => Promise<any>> common.fetch)(this.getEngine().targetUrl, {
                method		: 'get',
                data: ({
                    client : "gtx",
                    sl: sourceLanguage,
                    tl: destinationLanguage,
                    dt:'t',
                    q: batch.join("\n" + rowSeparator)
                }),
                //headers		: { 'Content-Type': 'application/json' },
            }).then((data) => {
                currentAction.nodeValue = "Reading response...";
                let googleTranslations = data[0]; // Each line becomes a translation...
                let uglyTranslations = [];
                for (let i = 0; i < googleTranslations.length; i++) {
                    uglyTranslations.push(googleTranslations[i][0]);
                }
                let cleanTranslations : string = uglyTranslations.join("\n");

                // Google doesn't destroy tags, but it adds spaces... "valid HTML" I guess.
                cleanTranslations = cleanTranslations.replaceAll(/ *< */g, "<");
                cleanTranslations = cleanTranslations.replaceAll(/ *> */g, ">");
                
                // Fuck empty lines
                cleanTranslations = cleanTranslations.replaceAll(/[\n]{2,}/g, "\n");

                // Fuck spaces at the end of lines
                cleanTranslations = cleanTranslations.replaceAll(/ *\n/g, "\n");

                // Case consistency
                cleanTranslations = cleanTranslations.replaceAll(new RegExp(rowSeparator, "gi"), rowSeparator);
                
                // we want to ignore line breaks on the sides of the row separator
                cleanTranslations = cleanTranslations.replaceAll("\n" + rowSeparator, rowSeparator);
                cleanTranslations = cleanTranslations.replaceAll(rowSeparator + "\n", rowSeparator);

                // Japanese loves repeating sentence enders !!!
                // Google does not
                cleanTranslations = cleanTranslations.replaceAll(/\n!/g, "!");
                cleanTranslations = cleanTranslations.replaceAll(/\n\?/g, "?");
                cleanTranslations = cleanTranslations.replaceAll(/\n\./g, ".");
                cleanTranslations = cleanTranslations.replaceAll(/\n;/g, ";");

                let pristineTranslations = cleanTranslations.split(rowSeparator);

                if (pristineTranslations.length != batch.length) {
                    this.error(`[RedGoogle] A batch broke due to mismatch. We sent ${batch.length} sentences and got ${pristineTranslations.length} back. Skipping them. You can find more details in the dev console (F12).`);
                    console.error("[RedGoogle] Ok, so then we sent THIS batch!");
                    console.warn(batch);
                    console.error("[RedGoogle] But they were, like, totally uncool and sent THIS back:");
                    console.warn(pristineTranslations);
                    console.error("[RedGoogle] So we didn't translate anything because we lost track of it all!");
                    console.error("[RedGoogle] Our " + rowSeparator + " should be in there somewhere, changed in some way. Perhaps we need a different one?");
                } else {
                    for (let i = 0; i < pristineTranslations.length; i++) {
                        translations[batchStart + i] = pristineTranslations[i].trim(); // Google loves spaces...
                        this.setCache(toTranslate[batchStart + i], pristineTranslations[i]);
                    }
                    progressCurrent.nodeValue = (parseInt(<string> progressCurrent.nodeValue) + pristineTranslations.length).toString();
                }
            }).catch(e => {
                currentAction.nodeValue = "DOH!";
                this.error("[Red Google] Error on fetch: " + e.message + ". Skipping batch.");
            }).finally(() => {
                translate(onSuccess, onError);
            });
        }

        return new Promise((onSuccess, onError) => {
            translate(onSuccess, onError);
        });
    }

    private lastRequest : number = 0;
    private delayed : Array<Function> = [];

    public delay (callback : Function) {
        let now = (new Date()).getTime();
        let engineDelay = (<any> this.getEngine()).innerDelay;
        let timeDelta = now - this.lastRequest;
        if (timeDelta >= engineDelay) {
            this.lastRequest = now;
            callback();
        } else {
            this.delayed.push(callback);
            setTimeout(() => {
                let cb = this.delayed.shift();
                if (cb != undefined) {
                    this.lastRequest = (new Date()).getTime();
                    cb();
                }
            }, engineDelay - timeDelta);
        }
    }

    public abort () {
        this.allowTranslation = false;
        this.waiting = [];
        this.paused = false;
        this.delayed = [];
    }

    constructor (thisAddon : any) {
        super(thisAddon,
            {
                id: "redgoogles",
                name: "Red Google Translator",
                languages : {
                    "af" : "Afrikaans", "sq" : "Albanian", "am" : "Amharic", "ar" : "Arabic", "hy" : "Armenian", "az" : "Azerbaijani", "eu" : "Basque", "be" : "Belarusian", "bn" : "Bengali", "bs" : "Bosnian", "bg" : "Bulgarian", "ca" : "Catalan", "ceb" : "Cebuano", "zh-CN" : "Chinese (Simplified)", "zh-TW" : "Chinese (Traditional)", "co" : "Corsican", "hr" : "Croatian", "cs" : "Czech", "da" : "Danish", "nl" : "Dutch", "en" : "English", "eo" : "Esperanto", "et" : "Estonian", "fi" : "Finnish", "fr" : "French", "fy" : "Frisian", "gl" : "Galician", "ka" : "Georgian", "de" : "German", "el" : "Greek", "gu" : "Gujarati", "ht" : "Haitian Creole", "ha" : "Hausa", "haw" : "Hawaiian", "he" : "Hebrew", "hi" : "Hindi", "hmn" : "Hmong", "hu" : "Hungarian", "is" : "Icelandic", "ig" : "Igbo", "id" : "Indonesian", "ga" : "Irish", "it" : "Italian", "ja" : "Japanese", "jw" : "Javanese", "kn" : "Kannada", "kk" : "Kazakh", "km" : "Khmer", "ko" : "Korean", "ku" : "Kurdish", "ky" : "Kyrgyz", "lo" : "Lao", "la" : "Latin", "lv" : "Latvian", "lt" : "Lithuanian", "lb" : "Luxembourgish", "mk" : "Macedonian", "mg" : "Malagasy", "ms" : "Malay", "ml" : "Malayalam", "mt" : "Maltese", "mi" : "Maori", "mr" : "Marathi", "mn" : "Mongolian", "my" : "Myanmar (Burmese)", "ne" : "Nepali", "no" : "Norwegian", "ny" : "Nyanja (Chichewa)", "ps" : "Pashto", "fa" : "Persian", "pl" : "Polish", "pt" : "Portuguese (Portugal, Brazil)", "pa" : "Punjabi", "ro" : "Romanian", "ru" : "Russian", "sm" : "Samoan", "gd" : "Scots Gaelic", "sr" : "Serbian", "st" : "Sesotho", "sn" : "Shona", "sd" : "Sindhi", "si" : "Sinhala (Sinhalese)", "sk" : "Slovak", "sl" : "Slovenian", "so" : "Somali", "es" : "Spanish", "su" : "Sundanese", "sw" : "Swahili", "sv" : "Swedish", "tl" : "Tagalog (Filipino)", "tg" : "Tajik", "ta" : "Tamil", "te" : "Telugu", "th" : "Thai", "tr" : "Turkish", "uk" : "Ukrainian", "ur" : "Urdu", "uz" : "Uzbek", "vi" : "Vietnamese", "cy" : "Welsh", "xh" : "Xhosa", "yi" : "Yiddish", "yo" : "Yoruba", "zu" : "Zulu"
                },
                targetUrl:"https://translate.google.com/translate_a/single",
                description: "A Google Translator using the same Text Processor as Red Sugoi Translator",
                batchDelay:1, // We'll handle these ourselves
                innerDelay: 10000, // Maybe give an option for users? Protect them from themselves?
                maximumBatchSize : 1000, // This should be limited by default T++, but we'll keep track on our side as well. 3000 gave errors some times!
                skipReferencePair:true,
                lineDelimiter: "<br>",
                mode: "rowByRow",
            }
            ,
            {
                "escapeAlgorithm": {
                    "type": "string",
                    "title": "Code Escaping Algorithm",
                    "description": "Escaping algorithm used for the Custom Escaper Patterns. For Google, it is recommended to use Tag placeholder, as Google tries to not break tags.",
                    "default": RedPlaceholderType.tagPlaceholder,
                    "required":false,
                    // @ts-ignore shhh it's fine don't worry bb
                    "enum": RedPlaceholderTypeArray
                  },
            },
            [
            ]);
    }
}