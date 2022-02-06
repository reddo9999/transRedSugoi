/// <reference path="RedTranslatorEngine.ts" />

class RedGoogleEngine extends RedTranslatorEngineWrapper {
    
    public doTranslate (toTranslate: string[], options: TranslatorEngineOptions): Promise<Array<string>> {
        let sourceLanguage = trans.getSl();
        let destinationLanguage = trans.getTl();

        let translating = 0;
        let translations = new Array(toTranslate.length);
        let maxBatchSize = (<any> this.getEngine()).maximumBatchSize;
        let delay = (<any> this.getEngine()).innerDelay;

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

        let translate = (onSuccess : (translated : Array<string>) => void, onError : (reason : string) => void) => {
            currentAction.nodeValue = "Gathering strings...";
            let batch : Array<string> = [];
            let batchSize = 0;

            // If for some reason we get one huge ass translation, we send it alone
            while (translating < toTranslate.length && (batchSize == 0 || maxBatchSize < (toTranslate[translating].length + batchSize))) {
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
            (<(...any:Array<any>) => Promise<any>> common.fetch)(this.getEngine().targetUrl, {
                method		: 'get',
                data: ({
                    client : "gtx",
                    sl: sourceLanguage,
                    tl: destinationLanguage,
                    dt:'t',
                    q: batch.join("\n\n\n")
                }),
                //headers		: { 'Content-Type': 'application/json' },
            }).then((a) => {
                currentAction.nodeValue = "Reading response...";
                (<any>window).response = a;
                console.log(a);
            }).catch(e => {
                currentAction.nodeValue = "DOH!";
                this.error("[Red Google] Error on fetch: " + e.message);
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
                innerDelay: 5000, // Maybe give an option for users? Protect them from themselves?
                maximumBatchSize : 3000, // This should be limited by default T++, but we'll keep track on our side as well
                skipReferencePair:true,
                lineDelimiter: "<br>",
                mode: "rowByRow",
            }
            ,
            {
            },
            [
            ]);
    }
}