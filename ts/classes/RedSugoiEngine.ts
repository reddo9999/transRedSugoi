/// <reference path="RedTranslatorEngine.ts" />

class RedSugoiEngine extends RedTranslatorEngineWrapper {

    /**
     * Updates URL array and picks the one with the least connections
     * @returns string
     */
     public getUrl () {
        this.updateUrls();
        let idx = this.urlUsage.indexOf(Math.min(...this.urlUsage));
        this.urlUsage[idx]++;
        this.urlScore[idx]++;
        return this.urls[idx];
    }

    public updateUrls () {
        let thisEngine = this.translatorEngine;
        let urls = thisEngine.targetUrl.replaceAll("\r", "").split("\n");
        if (this.urls.length != urls.length) {
            this.urls = [...urls];
            this.urlUsage = new Array(urls.length).fill(0);
            this.urlScore = new Array(urls.length).fill(0);
        }
    }

    public getUrlCount () {
        if (this.urls.length == 0) {
            this.updateUrls();
        }
        return this.urls.length;
    }

    public freeUrl (url : string) {
        this.urlUsage[this.urls.indexOf(url)]--;
    }

    public resetScores () {
        this.urlScore = new Array(this.urls.length).fill(0);
    }

    // Goals of refactor:
    // Split rows evenly between servers in single requests that respect maximum simultaneous translations.
    public doTranslate (rows: string[], options: TranslatorEngineOptions): Promise<TranslatorEngineResults> {
        this.resetScores();
        this.resume(true);
        this.allowTranslation = true;
        console.log("[REDSUGOI] TRANSLATE:\n", rows, options);
        let batchStart = new Date().getTime();

        let result : TranslatorEngineResults = {
			'sourceText':rows.join(), 
			'translationText':"",
			'source':rows, 
			'translation': <Array<string>> []
		};

        

        // First step: curate every single line and keep track of it
        let rowHandlers : Array<RedStringRowHandler> = [];
        let toTranslate : Array<string> = [];
        let translations : Array<string> = [];
        let translating = 0;
        for (let i = 0; i < rows.length; i++) {
            let handler = new RedStringRowHandler(rows[i], this);
            rowHandlers.push(handler);
            
            // Second step: separate every line that will need to be translated
            toTranslate.push(...handler.getTranslatableLines());
        }

        // Set up progress
        let consoleWindow = $("#loadingOverlay .console")[0];
        let progressTotal = document.createTextNode("/" + toTranslate.length.toString());
        let pre = document.createElement("pre");
        let progressNode = document.createTextNode("0");
        pre.appendChild(document.createTextNode("[RedSugoi] Translating current batch: "));
        pre.appendChild(progressNode);
        pre.appendChild(progressTotal);
        consoleWindow.appendChild(pre);
        let translatedLines = 0;

        console.log("[RedSugoi] Translations to send:", toTranslate);

        
        let updateProgress = () => {
            // A filthy hack for a filthy code
            progressNode.nodeValue = (translatedLines).toString();
            progressTotal.nodeValue = "/" + toTranslate.length.toString();
        };

        
        let maximumPayload = this.getEngine().getOptions().maxParallelJob || 5;
        let threads = this.getEngine().getOptions().threads || 1;
        let completedThreads = 0;
        let totalThreads = this.getUrlCount() * threads;
        let complete : 
            (onSuccess : (result : TranslatorEngineResults) => void, 
             onError : (error : Error) => void) 
             => void;

        // Third step: perform translations
        let doTranslate = (onSuccess : (result : TranslatorEngineResults) => void, onError : (error : Error) => void) => {
            if (translating >= toTranslate.length) {
                console.log("[RedSugoi] Thread has no more work to do.");
                complete(onSuccess, onError);
            } else {
                console.log("[RedSugoi] Thread Starting Work.")
                let myLines : Array<string> = [];
                let myStart = translating;
                translating = myStart + maximumPayload;
                for (let i = myStart; i < toTranslate.length; i++) {
                    myLines.push(toTranslate[i]);
                    if (myLines.length >= maximumPayload) {
                        break;
                    }
                }
                let myServer = this.getUrl();
                console.log("[RedSugoi] Fetching from " + myServer + ". Payload:" + myLines.length.toString());
                fetch(myServer, {
                    method		: 'post',
                    body		: JSON.stringify({content: myLines, message: "translate sentences"}),
                    headers		: { 'Content-Type': 'application/json' },
                })
                .then(async (response) => {
                    let result = await response.json();
                    console.log("[RedSugoi] Fetched from " + myServer + ". Received:" + result.length.toString());
                    if (result.length != myLines.length) {
                        console.error("[REDSUGOI] MISMATCH ON RESPONSE:", myLines, result);
                        let pre = document.createElement("pre");
                        pre.style.color = "red";
                        pre.style.fontWeight = "bold";
                        pre.appendChild(document.createTextNode("[REDSUGOI] Error translating a batch, received invalid response. Skipping..."));
                        consoleWindow.appendChild(pre);
                        return;
                    }
                    for (let i = 0; i < result.length; i++) {
                        translations[i + myStart] = result[i];
                        this.setCache(myLines[i], result[i]);
                    }
                    translatedLines += myLines.length;
                })
                .catch((error) => {
                    console.error("[REDSUGOI] ERROR ON FETCH USING " + myServer, "   Payload: " + myLines.join("\n"), error);
                    let pre = document.createElement("pre");
                    pre.style.color = "red";
                    pre.style.fontWeight = "bold";
                    pre.appendChild(document.createTextNode("[REDSUGOI] ERROR ON FETCH - " + error.name + ': ' + error.message));
                    consoleWindow.appendChild(pre);
                })
                .finally(() => {
                    this.freeUrl(myServer);
                    updateProgress();
                    doTranslate(onSuccess, onError);
                });
            }
        }

        complete = (onSuccess : (result : TranslatorEngineResults) => void, onError : (error : Error) => void) => {
            if (++completedThreads == totalThreads) {
                // Fourth step: return translations to each object
                let curatedIndex = 0;
                let internalIndex = 0;

                let finalTranslations : Array<string> = [];
                let curated : RedStringRowHandler = rowHandlers[curatedIndex];

                // Move through translations
                let moveRows = () => {
                    while (curated != undefined && curated.isDone(internalIndex)) {
                        curated.applyTranslation();
                        finalTranslations.push(curated.getTranslatedRow());
                        internalIndex = 0;
                        curated = rowHandlers[++curatedIndex];
                    }
                }

                // Check for empty rows
                moveRows();

                // Move through translations
                for (let outerIndex = 0; outerIndex < translations.length; outerIndex++) {
                    let translation = translations[outerIndex];
                    curated = rowHandlers[curatedIndex];

                    // Move through lines
                    curated.insertTranslation(translation, internalIndex++);

                    // Move through rows
                    moveRows();
                }

                // Final step: set up result object
                result.translation = finalTranslations;
                result.translationText = finalTranslations.join("\n");

                // return the object
                onSuccess(result);

                // Update progress
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

                pre.appendChild(document.createTextNode(`\n[RedSugoi] Batch took: ${seconds} seconds, which was about ${Math.round(10 * rows.length / seconds)/10} rows per second!`));
                pre.appendChild(document.createTextNode(`\n[RedSugoi] We skipped ${this.getCacheHits()} translations through cache hits!`));
                consoleWindow.appendChild(pre);
            }
        }


        (<any> window).rowHandlers = rowHandlers;

        
        return new Promise((onSuccess, onError) => {
            for (let i = 0; i < totalThreads; i++) {
                doTranslate(onSuccess, onError);
            }
        });
    }

    public doTranslateOld (text: string[], options: TranslatorEngineOptions): Promise<TranslatorEngineResults> {
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
                threads : 1,
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
                    "description": "The amount of translations that are sent to the server per request. Sweet spot will vary with hardware.",
                    "default":5,
                    "required":true
                },
                "threads": {
                    "type": "number",
                    "title": "Threads",
                    "description": "The amount of requests that are sent per server.",
                    "default":1,
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
                {
                    "key": "threads",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      this.translatorEngine.update("threads", parseInt(value));
                    }
                },
            ]);
    }
}