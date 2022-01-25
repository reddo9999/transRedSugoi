/// <reference path="RedStringEscaper.ts" />
declare var ui : any;

/**
 * Ideally this would just be a class extension but I don't want to play with EcmaScript 3
 */
class RedTranslatorEngineWrapper {
    private translatorEngine : TranslatorEngine;
    private urls : Array<string> = [];
    private urlUsage : Array<number> = [];
    private allowTranslation : boolean = true;

    public getEngine () {
        return this.translatorEngine;
    }

    public abort () {
        this.allowTranslation = false;
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
        }

        let idx = this.urlUsage.indexOf(Math.min(...this.urlUsage));
        this.urlUsage[idx]++;
        return this.urls[idx];
    }

    public freeUrl (url : string) {
        this.urlUsage[this.urls.indexOf(url)]--;
    }

    public translate (text : Array<string>, options : any) {
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
        consoleWindow.appendChild(pre);

        let translatedLines = 0;
        let updateProgress = () => {
            progressCurrent.nodeValue = (++translatedLines).toString();
        };

        if ((<HTMLElement> document.getElementById("loadingOverlay")).classList.contains("hidden")) {
            ui.showBusyOverlay();
        }
        
        let complete = () => {
            finished++;
            if (finished == threads) {
                if ((<HTMLElement> document.getElementById("loadingOverlay")).classList.contains("hidden")) {
                    ui.hideBusyOverlay();
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

                    let sugoiArray : Array<string> = []
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i].trim();

                        // After a while, empty lines make the AI behave ... erratically
                        // Probably best to skip them all together
                        if (line == "") continue;

                        // escape!
                        let tags = new RedStringEscaper(line, escapingType, splitEnds, true);
                        curated.push(tags);
                        sugoiArray.push(tags.getReplacedText());
                    }

                    fetch(myUrl, {
                        method		: 'post',
                        body		: JSON.stringify({content: sugoiArray, message: "translate sentences"}),
                        headers		: { 'Content-Type': 'application/json' },
                    })
                    .then(async (response) => {
                        let result = await response.json();
                        let finalTranslation : Array<string> = [];
                        for (let i = 0; i < curated.length; i++) {
                            // For some reason, Sugoi really dislikes empty strings. Ideally we wouldn't send any, but beacause some strings can be comprised entirely of symbols, it can still happen
                            // I don't want to code an ideal solution, so instead I'll just do this.
                            if (curated[i].getReplacedText() != "") {
                                curated[i].setTranslatedText(result[i]);
                            }
                            finalTranslation.push(curated[i].recoverSymbols());
                        }
                        translations[mine] = (finalTranslation).join("\n");
                    })
                    .catch((error) => {
                        console.error("[REDSUGOI] ERROR ON FETCH USING " + myUrl, "   Payload: " + text[mine], error);
                    })
                    .finally(() => {
                        this.freeUrl(myUrl);
                        updateProgress();
                        doTranslate();
                    });
                }
            } catch (e) {
                console.error("[REDSUGOI] ERROR ON THREAD EXECUTION, SKIPPING", e);
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
                    "description": "Sugoi Translator target URL.",
                    "default":"http://localhost:14366/",
                    "required":true
                },
                "maxParallelJob": {
                    "type": "number",
                    "title": "Max Parallel job",
                    "description": "Amount of requests done simultaneously. Due to the small latency between calls, you'll usually want 3 or 5 requests per server. You won't gain any actual speed if your resource usage is already at 100%, might even make it slower, so try to find a number that results in no waste, but also results in no overworking.",
                    "default":5,
                    "required":true
                },
                "escapeAlgorithm": {
                  "type": "string",
                  "title": "Code Escaping Algorithm",
                  "description": "Escaping algorithm for inline code inside dialogues. Sugoi Translator is unpredictable. Hex Placeholder seems to work, but is interpreted weirdly. Pole Position Placeholder seems to be kept as-is more frequently and doesn't make a mess as often. Closed Nines will enclose a large number by two bounding 9s. It appears to get mangled by Sugoi very often.",
                  "default": RedPlaceholderType.poleposition,
                  "required":false,
                  "enum": RedPlaceholderTypeArray
                },
                "splitEnds": {
                    "type": "boolean",
                    "title": "Split Ends",
                    "description": "For added compatibility, symbols that begin or end sentences will not be sent to the translator. This deprives the translator from contextual information, but guarantees the symbol will not be lost nor misplaced.",
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
    }
}