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

    public reduceScore (url : string) {
        let idx = this.urls.indexOf(url);
        if (idx != -1) {
            this.urlScore[idx]--; // shame on you little server.
        }
    }

    public updateUrls () {
        let thisEngine = this.translatorEngine;
        let urls = thisEngine.targetUrl.replaceAll("\r", "").split("\n");
        if (this.urls.length != urls.length) {
            this.urls = [...urls];
            // Some users might forget the final slash, let's fix that. Might as well make sure it's nice and trimmed while at it.
            for (let i = 0; i < this.urls.length; i++) {
                this.urls[i] = this.urls[i].trim();
                if (this.urls[i].charAt(this.urls[i].length - 1) != "/") {
                    this.urls[i] += "/";
                }
            }
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
    public doTranslate (toTranslate: string[], options: TranslatorEngineOptions): Promise<Array<string>> {
        this.resetScores();
        console.log("[REDSUGOI] TRANSLATE:\n", toTranslate, options);
        let batchStart = new Date().getTime();

        let translating = 0;
        let translations : Array<string> = [];

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
        // I don't know why we didn't do this
        // Maybe I have brain damage
        this.updateUrls();
        let totalThreads = this.getUrlCount() * threads;
        let complete : 
            (onSuccess : (result : Array<string>) => void, 
             onError : (error : Error) => void) 
             => void;

        // Third step: perform translations
        let doTranslate = (onSuccess : (result : Array<string>) => void, onError : (error : Error) => void) => {
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
                    if (response.ok) {
                        let result = await response.json();
                        console.log("[RedSugoi] Fetched from " + myServer + ". Received:" + result.length.toString());
                        if (result.length != myLines.length) {
                            console.error("[REDSUGOI] MISMATCH ON RESPONSE:", myLines, result);
                            throw new Error(`Received invalid response - length mismatch, check server stability.`);
                        }
                        for (let i = 0; i < result.length; i++) {
                            translations[i + myStart] = result[i];
                            this.setCache(myLines[i], result[i]);
                        }
                        translatedLines += myLines.length;
                    } else {
                        throw new Error(`${response.status.toString()} - ${response.statusText}`);
                    }
                })
                .catch((error) => {
                    console.error("[REDSUGOI] ERROR ON FETCH USING " + myServer, "   Payload: " + myLines.join("\n"), error);
                    let pre = document.createElement("pre");
                    pre.style.color = "red";
                    pre.style.fontWeight = "bold";
                    pre.appendChild(document.createTextNode(`[RedSugoi] Error while fetching from ${myServer} - ${error.name}: ${error.message}\n${' '.repeat(11)}If all fetch attempts fail on this server, check if it's still up.`));
                    this.reduceScore(myServer);
                    consoleWindow.appendChild(pre);
                })
                .finally(() => {
                    this.freeUrl(myServer);
                    updateProgress();
                    doTranslate(onSuccess, onError);
                });
            }
        }

        complete = (onSuccess : (result : Array<string>) => void, onError : (error : Error) => void) => {
            if (++completedThreads == totalThreads) {
                // return the object
                onSuccess(translations);

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

                pre.appendChild(document.createTextNode(`\n[RedSugoi] Batch took: ${seconds} seconds, which was about ${Math.round(10 * toTranslate.join("").length / seconds)/10} characters per second!`));
                pre.appendChild(document.createTextNode(`\n[RedSugoi] We skipped ${this.getCacheHits()} translations through cache hits!`));
                consoleWindow.appendChild(pre);
            }
        }

        
        return new Promise((onSuccess, onError) => {
            for (let i = 0; i < totalThreads; i++) {
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
                    "description": "The amount of translations that are sent to the server per request. Sweet spot will vary with hardware. In general, the bigger the number, the faster it goes - provided you have enough RAM/VRAM. Lower numbers should be used with multiple servers for effective load balancing.",
                    "default":5,
                    "required":true
                },
                "threads": {
                    "type": "number",
                    "title": "Threads",
                    "description": "The amount of requests that are sent per server. This can be used to combat latency between Translator++ making a request and waiting on the answer, resulting in less idle time for the servers. This is a per-server setting, so if you have three servers and three threads, that's 3 requests per server for a total of 9 open requests.",
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
                    "type": "actions",
                    "title" : "Copy Sugoi Translator Target URL",
                    "fieldHtmlClass": "actionButtonSet",
                    "items": [
                      {
                        "type": "button",
                        "title": "Copy Sugoi Translator Target URL",
                        "onClick" : function(ev : any) {
                            try {
                                let headHoncho = (ev.target).parentNode.parentNode;
                                let $targetUrl = $(headHoncho).find('[name="targetUrl"]')
                                $targetUrl.val(trans.sugoitrans.targetUrl);
                                trans.redsugoi.update("targetUrl", trans.sugoiTrans.targetUrl);
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