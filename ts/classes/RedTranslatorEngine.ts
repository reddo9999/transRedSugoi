/// <reference path="RedStringEscaper.ts" />
declare var ui : any;

/**
 * Ideally this would just be a class extension but I don't want to play with EcmaScript 3
 */
class RedTranslatorEngineWrapper {
    private translatorEngine : TranslatorEngine;
    private urls : Array<string> = [];
    private urlUsage : Array<number> = [];
    private urlScore : Array<number> = [];
    private allowTranslation : boolean = true;
    private paused : boolean = false;
    private waiting : Array<Function> = [];
    // Cache Translations so we can save up time!
    // In most scenarios this will not help, but if there is a consistent string reuse it might.
    // e.g. CharacterName: at the start of every Dialogue.
    // Plus not redoing the work is just good practice.
    // Would it be worth it to save this to a file and keep updating it through multiple games?
    // The bigger it gets the slower it should be to access, but wouldn't it still be faster than repeating the work?
    private translationCache : {[text : string] : string} = {};

    public getEngine () {
        return this.translatorEngine;
    }

    public abort () {
        this.allowTranslation = false;
        this.waiting = [];
        this.paused = false;
    }

    public pause () {
        this.paused = true;
    }

    public resume (reset? : boolean) {
        this.paused = false;
        
        if (reset == true) {
            this.waiting = [];
        } else {
            this.waiting.forEach(callback => {
                callback();
            });
            this.waiting = [];
        }
    }

    /**
     * Updates URL array and picks the one with the least connections
     * @returns string
     */
    public getUrl () {
        let thisEngine = this.translatorEngine;
        let urls = thisEngine.targetUrl.replaceAll("\r", "").split("\n");
        if (this.urls.length != urls.length) {
            this.urls = [...urls];
            this.urlUsage = new Array(urls.length).fill(0);
            this.urlScore = new Array(urls.length).fill(0);
        }

        let idx = this.urlUsage.indexOf(Math.min(...this.urlUsage));
        this.urlUsage[idx]++;
        this.urlScore[idx]++;
        return this.urls[idx];
    }

    public freeUrl (url : string) {
        this.urlUsage[this.urls.indexOf(url)]--;
    }

    public resetScores () {
        this.urlScore = new Array(this.urls.length).fill(0);
    }

    public isCaching () : boolean {
        let useCache = this.getEngine().getOptions().useCache;
        return useCache == undefined ? true : useCache == true;
    }

    public translate (text : Array<string>, options : any) {
        this.resetScores();
        let cacheHits = 0;
        let batchStart = new Date().getTime();
        this.resume(true);
        console.log("[REDSUGOI] TRANSLATE:\n", text, options);
        this.allowTranslation = true;
        options = options||{};

        options.onAfterLoading = options.onAfterLoading||function() {};
        options.onError = options.onError||function() {};
        options.always = options.always||function() {};

        // Since it's offline we shan't make batches. The overhead, I hope, should be small!
        let threads = this.getEngine().getOptions().maxParallelJob || 1;
        let pick = 0;
        let finished = 0;
        let translations : Array<string> = new Array(text.length); // errors will be gracefully left empty I HOPE

        let result = {
			'sourceText':text.join(), 
			'translationText':"",
			'source':text, 
			'translation': <Array<string>> []
		};

        let consoleWindow = $("#loadingOverlay .console")[0];
        let progressCurrent = document.createTextNode("0");
        let progressTotal = document.createTextNode("/" + text.length.toString());
        let pre = document.createElement("pre");
        pre.appendChild(document.createTextNode("[RedSugoi] Translating current batch: "));
        pre.appendChild(progressCurrent);
        pre.appendChild(progressTotal);

        let translatedLines = 0;
        let updateProgress = () => {
            progressCurrent.nodeValue = (++translatedLines).toString();
        };

        if ((<HTMLElement> document.getElementById("loadingOverlay")).classList.contains("hidden")) {
            ui.showBusyOverlay();
        } else {
            consoleWindow.appendChild(pre);
        }
        
        let complete = () => {
            finished++;
            if (finished == threads) {
                if ((<HTMLElement> document.getElementById("loadingOverlay")).classList.contains("hidden")) {
                    ui.hideBusyOverlay();
                } else {
                    let batchEnd = new Date().getTime();
                    let pre = document.createElement("pre");
                    pre.appendChild(document.createTextNode("[RedSugoi] Batch Translated! Best servers were:"));
                    let servers = [...this.urls];
                    servers.sort((a, b) => {
                        return this.urlScore[this.urls.indexOf(b)] - this.urlScore[this.urls.indexOf(a)];
                    });
                    for (let i = 0; i < servers.length; i++) {
                        pre.appendChild(document.createTextNode(`\n[RedSugoi] #${i + 1} - ${servers[i]} (${this.urlScore[this.urls.indexOf(servers[i])]} translations)`));
                    }

                    let seconds = Math.round((batchEnd - batchStart)/100)/10;

                    pre.appendChild(document.createTextNode(`\n[RedSugoi] Batch took: ${seconds} seconds, which was about ${Math.round(10 * text.length / seconds)/10} rows per second!`));
                    pre.appendChild(document.createTextNode(`\n[RedSugoi] We skipped ${cacheHits} translations through cache hits!`));
                    consoleWindow.appendChild(pre);
                }
                if (typeof options.onAfterLoading == 'function') {
                    result.translationText = translations.join();
                    result.translation = translations;
                    options.onAfterLoading.call(this.translatorEngine, result);
                }
            }
        }

        let escapingType = this.getEngine().getOptions().escapeAlgorithm || RedPlaceholderType.poleposition;
        let splitEnds = this.getEngine().getOptions().splitEnds;
        splitEnds = splitEnds == undefined ? true : splitEnds === true; // set to true if undefined, check against true if not

        let doTranslate = async () => {
            if (this.paused) {
                this.waiting.push(doTranslate);
                return;
            }
            if (!this.allowTranslation) {
                complete();
                return;
            }
            try {
                let mine = pick++;
                if (mine >= text.length) {
                    complete();
                } else {
                    // ajax
                    let myUrl = this.getUrl();

                    let curated : Array<RedStringEscaper> = [];
                    // now we need to prepare the stuff we'll send over to Sugoi.
                    // Some games might have rolling text which is far too big to translate at once. This kills the sugoi.
                    // probably the best way to detect those is through blank lines.
                    // Might be a good idea to also split if new lines start with something that we're escaping
                    // First Step = "Break if you find one or more empty lines"
                    let lines = text[mine].split(/( *\r?\n(?:\r?\n)+ *)/);

                    // Second Step = "Break if a line ends with something that finishes a sentence"
                    for (let i = lines.length - 1; i >= 0; i--) {
                        let line = lines[i];
                        let split = line.split(/([｝）］】」』〟⟩！？。・…‥：]+ *\r?\n)/);
                        // We need to give back the end of the sentence so that it translates correctly
                        for (let k = 0; k < split.length - 1; k++) {
                            split[k] += split[k+1];
                            split.splice(k+1, 1);
                        }
                        lines.splice(i, 1, ...split);
                    }

                    // Third step = "Break if a line starts with something that initiates a sentence"
                    for (let i = lines.length - 1; i >= 0; i--) {
                        let line = lines[i];
                        let split = line.split(/((?:\r?\n)+[｛（［【「『〝⟨「]+)/);
                        // We need to give back the start of the sentence so that it translates correctly
                        for (let k = 1; k < split.length - 1; k++) {
                            split[k] += split[k+1];
                            split.splice(k+1, 1);
                        }
                        lines.splice(i, 1, ...split);
                    }

                    let sugoiArray : Array<string> = [];
                    let sugoiArrayTracker : {[index : number] : number} = {}; // Keeps track of which translated string is from which tag
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i].trim();

                        // escape!
                        let tags = new RedStringEscaper(line, escapingType, splitEnds, true);
                        let myIndex = curated.push(tags) - 1;
                        let escapedText = tags.getReplacedText();
                        // After a while, empty lines make the AI behave ... erratically
                        if (escapedText.trim() != "" && this.translationCache[escapedText] == undefined) {
                            sugoiArrayTracker[myIndex] = sugoiArray.push(escapedText) - 1;
                        }
                    }

                    if (sugoiArray.length > 0) {
                        fetch(myUrl, {
                            method		: 'post',
                            body		: JSON.stringify({content: sugoiArray, message: "translate sentences"}),
                            headers		: { 'Content-Type': 'application/json' },
                        })
                        .then(async (response) => {
                            let result = await response.json();
                            let finalTranslation : Array<string> = [];
                            for (let i = 0; i < curated.length; i++) {
                                let translatedIndex = sugoiArrayTracker[i];
                                if (result[translatedIndex] != undefined) {
                                    if (this.isCaching()) {
                                        this.translationCache[curated[i].getReplacedText()] = result[translatedIndex];
                                    }
                                    curated[i].setTranslatedText(result[translatedIndex]);
                                } else if (this.translationCache[curated[i].getReplacedText()] != undefined) {
                                    cacheHits++;
                                    curated[i].setTranslatedText(this.translationCache[curated[i].getReplacedText()]);
                                }
                                finalTranslation.push(curated[i].recoverSymbols());
                            }
                            translations[mine] = (finalTranslation).join("\n");
                        })
                        .catch((error) => {
                            console.error("[REDSUGOI] ERROR ON FETCH USING " + myUrl, "   Payload: " + text[mine], error);
                            let pre = document.createElement("pre");
                            pre.style.color = "red";
                            pre.style.fontWeight = "bold";
                            pre.appendChild(document.createTextNode("[REDSUGOI] ERROR ON FETCH - " + error.name + ': ' + error.message));
                            consoleWindow.appendChild(pre);
                        })
                        .finally(() => {
                            this.freeUrl(myUrl);
                            updateProgress();
                            doTranslate();
                        });
                    } else {
                        // Nothing to translate or all cache hits
                        let finalTranslation : Array<string> = [];
                        for (let i = 0; i < curated.length; i++) {
                            let translatedIndex = sugoiArrayTracker[i];
                            if (this.translationCache[curated[i].getReplacedText()] != undefined) {
                                cacheHits++;
                                curated[i].setTranslatedText(this.translationCache[curated[i].getReplacedText()]);
                            }
                            finalTranslation.push(curated[i].recoverSymbols());
                        }
                        translations[mine] = (finalTranslation).join("\n");
                        this.freeUrl(myUrl);
                        updateProgress();
                        doTranslate();
                    }
                }
            } catch (error : any) {
                console.error("[REDSUGOI] ERROR ON THREAD EXECUTION, SKIPPING", error);
                let pre = document.createElement("pre");
                pre.style.color = "red";
                pre.style.fontWeight = "bold";
                pre.appendChild(document.createTextNode("[REDSUGOI] ERROR ON THREAD - " + error.name + ': ' + error.message));
                consoleWindow.appendChild(pre);
                complete();
            }
        }

        for (let i = 0; i < threads; i++) {
            doTranslate();
        }
    }

    constructor (thisAddon : any) {
        let escapingTitleMap : {[id : string] : string} = RedPlaceholderTypeNames;

        this.translatorEngine = new TranslatorEngine({
            id:thisAddon.package.name,
            name:thisAddon.package.title,
            author:thisAddon.package.author.name,
            version:thisAddon.package.version,
            description:thisAddon.package.description,
            batchDelay:1,
            skipReferencePair:true,
            lineDelimiter: "<br>",
            mode: "rowByRow",
            targetUrl:"http://localhost:14366/",
            languages:{
                "en": "English",
                "ja": "Japanese"
              },
            optionsForm:{
              "schema": {
                "targetUrl": {
                    "type": "string",
                    "title": "Target URL(s)",
                    "description": "Sugoi Translator target URL. If you have multiple servers, you can put one in each line.",
                    "default":"http://localhost:14366/",
                    "required":true
                },
                "maxParallelJob": {
                    "type": "number",
                    "title": "Max Parallel job",
                    "description": "The amount of requests which will be sent simultaneously. Due to the small latency between sending a request and receiving a response, you'll usually want at least 5 requests per server so that you don't leave resources idling. Bigger numbers are also fine, but there are diminishing returns and you will lose Cache benefits if the number is too large. Recommended values are 5 to 10 per server (so if you have two servers, ideal number would be between 10 and 20). Remember, the goal is to not have anything idle, but you also don't want to overwhelm your servers to the point they start underperforming.",
                    "default":5,
                    "required":true
                },
                "escapeAlgorithm": {
                  "type": "string",
                  "title": "Code Escaping Algorithm",
                  "description": "Escaping algorithm used for the Custom Escaper Patterns. For Sugoi Translator, it is recommended to use Poleposition Placeholder, which replaces symbols with a hashtag followed by a short number. All options are available, should a particular project require them.",
                  "default": RedPlaceholderType.poleposition,
                  "required":false,
                  "enum": RedPlaceholderTypeArray
                },
                "splitEnds": {
                    "type": "boolean",
                    "title": "Split Ends",
                    "description": "For added compatibility, symbols that begin or end sentences will not be sent to the translator. This deprives the translator from contextual information, but guarantees the symbol will not be lost nor misplaced. If the symbols at the corners are not actually part of the text this will actually improve translation accuracy while also increasing speed. Recommended is ON.",
                    "default":true
                },
                "useCache": {
                    "type": "boolean",
                    "title": "Use Cache",
                    "description": "To improve speed, every translation sent to Sugoi Translator will be stored in case the same sentence appears again. Depending on the game, this can range from 0% gains to over 50%. There are no downsides, but in case you want to test the translator itself this is left as an option. Recommended is ON.",
                    "default":true
                },
              },
              "form": [
                {
                    "key": "targetUrl",
                    "type": "textarea",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      var urls = value.replaceAll("\r", "").split("\n");
                      var validUrls = [];
                      for (var i in urls) {
                          if (!isValidHttpUrl(urls[i])) continue;
                          validUrls.push(urls[i]);
                      }
                      this.translatorEngine.update("targetUrl", validUrls.join("\n"));
                      $(<HTMLInputElement> evt.target).val(validUrls.join("\n"));
                    }
                },
                {
                    "key": "maxParallelJob",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      this.translatorEngine.update("maxParallelJob", parseInt(value));
                    }
                },
                {
                  "key": "escapeAlgorithm",
                  "titleMap": escapingTitleMap,
                  "onChange": (evt : Event) => {
                    var value = $(<HTMLInputElement>evt.target).val();
                    this.translatorEngine.update("escapeAlgorithm", value);
                  }
                },
                {
                    "key": "splitEnds",
                    "inlinetitle": "Cut Corners",
                    "onChange": (evt : Event) => {
                      var value = $(<HTMLInputElement> evt.target).prop("checked");
                      this.translatorEngine.update("splitEnds", value);
                    }
                },
                {
                    "key": "useCache",
                    "inlinetitle": "Use Cache",
                    "onChange": (evt : Event) => {
                      var value = $(<HTMLInputElement> evt.target).prop("checked");
                      this.translatorEngine.update("useCache", value);
                    }
                }
              ]
            }
        });

        this.translatorEngine.translate = (text : Array<string>, options : any) => {
            this.translate(text, options);
        }

        this.translatorEngine.abort = () => {
            this.abort();
        }

        this.translatorEngine.pause = () => {
            this.pause();
        }

        this.translatorEngine.resume = () => {
            this.resume();
        }
    }
}