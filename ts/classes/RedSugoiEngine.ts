/// <reference path="RedTranslatorEngine.ts" />

class RedSugoiEngine extends RedTranslatorEngineWrapper {

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

    public doTranslate (text: string[], options: TranslatorEngineOptions): Promise<TranslatorEngineResults> {
        this.resetScores();
        let cacheHits = 0;
        let batchStart = new Date().getTime();
        this.resume(true);
        this.allowTranslation = true;
        console.log("[REDSUGOI] TRANSLATE:\n", text, options);

        let consoleWindow = $("#loadingOverlay .console")[0];
        let progressTotal = document.createTextNode("/" + text.length.toString());
        let pre = document.createElement("pre");
        let progressNode = document.createTextNode("0");
        pre.appendChild(document.createTextNode("[RedSugoi] Translating current batch: "));
        pre.appendChild(progressNode);
        pre.appendChild(progressTotal);
        consoleWindow.appendChild(pre);

        // Since it's offline we shan't make batches. The overhead, I hope, should be small!
        let threads = this.getEngine().getOptions().maxParallelJob || 1;
        let pick = 0;
        let finished = 0;
        let translations : Array<string> = new Array(text.length); // errors will be gracefully left empty I HOPE
        

        let result : TranslatorEngineResults = {
			'sourceText':text.join(), 
			'translationText':"",
			'source':text, 
			'translation': <Array<string>> []
		};

        let translatedLines = 0;
        let updateProgress = () => {
            progressNode.nodeValue = (++translatedLines).toString();
        };

        let complete = (onSuccess : (result : TranslatorEngineResults) => void, onError : (error : Error) => void) => {
            finished++;
            if (finished == threads) {
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

                result.translationText = translations.join();
                result.translation = translations;
                onSuccess(result);
            }
        }

        let doTranslate = async (onSuccess : (result : TranslatorEngineResults) => void, onError : (error : Error) => void) => {
            if (this.paused) {
                this.waiting.push(doTranslate);
                return;
            }
            if (!this.allowTranslation) {
                complete(onSuccess, onError);
                return;
            }
            try {
                let mine = pick++;
                if (mine >= text.length) {
                    complete(onSuccess, onError);
                } else {
                    let sugoiArray : Array<string> = [];
                    let sugoiArrayTracker : {[index : number] : number} = {}; // Keeps track of which translated string is from which tag
                    
                    let curated = this.curateRow(text[mine]);

                    // After a while, empty lines make the AI behave ... erratically
                    for (let i = 0; i < curated.length; i++) {
                        let escapedText = curated[i].getReplacedText();
                        if (escapedText.trim() != "" && this.translationCache[escapedText] == undefined) {
                            sugoiArrayTracker[i] = sugoiArray.push(escapedText) - 1;
                        }
                    }

                    let myUrl = this.getUrl();
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
                                    console.log("[RedSugoi] Translated a thing!", {
                                        originalText : curated[i].getOriginalText(),
                                        translatedText : result[translatedIndex]
                                    });
                                    curated[i].setTranslatedText(result[translatedIndex]);
                                } else if (this.translationCache[curated[i].getReplacedText()] != undefined) {
                                    console.log("[RedSugoi] Got a cache hit!", {
                                        originalText : curated[i].getOriginalText(),
                                        translatedText : this.translationCache[curated[i].getReplacedText()]
                                    });
                                    cacheHits++;
                                    curated[i].setTranslatedText(this.translationCache[curated[i].getReplacedText()]);
                                }
                                finalTranslation.push(curated[i].recoverSymbols());
                            }
                            let finalTranslationString = finalTranslation.join("\n");
                            translations[mine] = finalTranslationString;
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
                            doTranslate(onSuccess, onError);
                        });
                    } else {
                        // Nothing to translate or all cache hits
                        let finalTranslation : Array<string> = [];
                        for (let i = 0; i < curated.length; i++) {
                            if (this.translationCache[curated[i].getReplacedText()] != undefined) {
                                cacheHits++;
                                curated[i].setTranslatedText(this.translationCache[curated[i].getReplacedText()]);
                            }
                            finalTranslation.push(curated[i].recoverSymbols());
                        }
                        translations[mine] = (finalTranslation).join("\n");
                        this.freeUrl(myUrl);
                        updateProgress();
                        doTranslate(onSuccess, onError);
                    }
                }
            } catch (error : any) {
                console.error("[REDSUGOI] ERROR ON THREAD EXECUTION, SKIPPING", error);
                let pre = document.createElement("pre");
                pre.style.color = "red";
                pre.style.fontWeight = "bold";
                pre.appendChild(document.createTextNode("[REDSUGOI] ERROR ON THREAD - " + error.name + ': ' + error.message));
                consoleWindow.appendChild(pre);
                complete(onSuccess, onError);
            }
        }

        return new Promise((onSuccess, onError) => {
            for (let i = 0; i < threads; i++) {
                doTranslate(onSuccess, onError);
            }
        });
    }

    constructor (thisAddon : any) {
        super(thisAddon,
            {
                id: "redsugoi",
                name: "Red Sugoi Translator",
                targetUrl:"http://localhost:14366/",
                languages:{
                    "en": "English",
                    "ja": "Japanese"
                },
                description:thisAddon.package.description,
                batchDelay:1,
                skipReferencePair:true,
                lineDelimiter: "<br>",
                mode: "rowByRow",
                maxRequestLength : Number.MAX_VALUE,
                maxParallelJob : 5,
            }
            ,
            {
                "targetUrl": {
                    "type": "string",
                    "title": "Target URL(s)",
                    "description": "Sugoi Translator target URL. If you have multiple servers, you can put one in each line. IMPORTANT: This is not updated by the default Sugoi Translator plugin! You need to set it up separatedly!",
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
            },
            [
                {
                    "key": "targetUrl",
                    "type": "textarea",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      var urls = value.replaceAll("\r", "").split("\n");
                      var validUrls = [];
                      for (var i in urls) {
                          if (!this.isValidHttpUrl(urls[i])) continue;
                          validUrls.push(urls[i]);
                      }
                      this.translatorEngine.update("targetUrl", validUrls.join("\n"));
                      $(<HTMLInputElement> evt.target).val(validUrls.join("\n"));
                    }
                },
                {
                    "type": "actions",
                    "title" : "Local Server Manager",
                    "fieldHtmlClass": "actionButtonSet",
                    "items": [
                      {
                        "type": "button",
                        "title": "Open server manager",
                        "onClick" : function() {
                            try {
                                trans.sugoitrans.openServerManager()
                            } catch (e) {
                                alert("This requires an up-to-date Sugoi Translator addon by Dreamsavior, it's just a shortcut. Sorry, little one.");
                            }
                        }
                      }
            
                    ]
                },
                {
                    "key": "maxParallelJob",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      this.translatorEngine.update("maxParallelJob", parseInt(value));
                    }
                },
            ]);
    }
}