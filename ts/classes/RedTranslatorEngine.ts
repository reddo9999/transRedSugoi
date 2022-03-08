/// <reference path="RedStringEscaper.ts" />
/// <reference path="RedPersistentCacheHandler.ts" />
declare var ui : any;

interface RedScriptCheckResponse {
    isScript : boolean;
    quoteType? : string;
    newLine? : string;
}

const defaultLineStart = `((?:\\r?\\n|^) *　*[◎▲▼▽■□●○★☆♥♡♪＿＊－＝＋＃＄―※〇〔〖〘〚〝｢〈《「『【（［\\[\\({＜<｛｟"'>\\/\\\\]+)`;
const defaultLineEnd = `([\\]\\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩！？。・…‥：；"'.?!;:]+ *　*(?:$|\\r*\\n))`;
const defaultParagraphBreak = `( *　*\\r?\\n(?:\\r?\\n)+ *　*)`;
const openerRegExp = `〔〖〘〚〝｢〈《「『【（［\\[\\({＜<｛｟"'`;
const closerRegExp = `\\]\\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩"'`;
const rmColorRegExp = `\\\\C\\[.+?\\]`;
const mvScript = `\\\\*[V]+`;
// RegExp:  not lookbehind: mvScript
//          lookbehind: opener or rmColor
//          match: anything that's not opener nor closer
//          lookahead: closer or rmColor
// Result: look for anything that's not opener or closer that is inside opener or closer and not inside an MVScript
const defaultIsolateRegexp = 
`(`+ 
    `(?<!` +
        `${mvScript}` + 
    `)` +
    `[${openerRegExp}]([^${openerRegExp + closerRegExp}])+[${closerRegExp}]` +
`)|(` +
    `${rmColorRegExp}.+?${rmColorRegExp}` +
`)`;
    

/**
 * Ideally this would just be a class extension but I don't want to play with EcmaScript 3
 */
abstract class RedTranslatorEngineWrapper {
    protected translatorEngine : TranslatorEngine;
    protected urls : Array<string> = [];
    protected urlUsage : Array<number> = [];
    protected urlScore : Array<number> = [];
    protected allowTranslation : boolean = true;
    protected paused : boolean = false;
    protected waiting : Array<Function> = [];
    protected cacheHandler : RedPersistentCacheHandler;

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


    public isCaching () : boolean {
        let useCache = this.getEngine().getOptions().useCache;
        return useCache == undefined ? true : useCache == true;
    }

    public isKeepingScripts () : boolean {
        let detectStrings = this.getEngine().getOptions().detectStrings;
        return detectStrings == undefined ? true : detectStrings == true;
    }

    public isMergingSymbols () : boolean {
        let mergeSymbols = this.getEngine().getOptions().mergeSymbols;
        return mergeSymbols == undefined ? true : mergeSymbols == true;
    }

    public isPersistentCaching () : boolean {
        let usePersistentCache = this.getEngine().getOptions().usePersistentCache;
        return usePersistentCache == undefined ? true : usePersistentCache == true;
    }

    private cacheHits = 0;

    public hasCache (text : string) {
        return this.cacheHandler.hasCache(text);
    }

    public getCache (text : string) {
        this.cacheHits++;
        return this.cacheHandler.getCache(text);
    }

    public setCache (text : string, translation : string) {
        this.cacheHandler.addCache(text, translation);
    }

    public getCacheHits () {
        return this.cacheHits;
    }

    public resetCacheHits () {
        this.cacheHits = 0;
    }

    public getRowStart () {
        let option = this.getEngine().getOptions().rowStart;
        if (typeof option == "undefined") {
            return (<any> this.getEngine()).rowStart;
        } else {
            return option;
        }
    }

    public getRowEnd () {
        let option = this.getEngine().getOptions().rowEnd;
        if (typeof option == "undefined") {
            return (<any> this.getEngine()).rowEnd;
        } else {
            return option;
        }
    }

    public breakRow (text : string) : Array<string> {
        // now we need to prepare the stuff we'll send over to Sugoi.
        // Some games might have rolling text which is far too big to translate at once. This kills the sugoi.
        // probably the best way to detect those is through blank lines.
        // Might be a good idea to also split if new lines start with something that we're escaping


        // First Step = "Break if you find one or more empty lines"
        let lines = text.split(new RegExp(defaultParagraphBreak));

        // Second Step = "Break if a line ends with something that finishes a sentence"
        for (let i = lines.length - 1; i >= 0; i--) {
            let line = lines[i];
            //let split = line.split(/([｝）］】」』〟⟩！？。・…‥："'\.\?\!;:]+ *　*\r?\n)/);
            //let split = line.split(/([〕〗〙〛〞”｣〉》」』】）］＞｝｠〟⟩！？。・…‥：；"'\.\?\!;:]+ *　*\r?\n)/); //Fantom#9835's list, ty
            let split = line.split(new RegExp(this.getRowEnd()));
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
            //let split = line.split(/((?:^|(?:\r?\n))+ *　*[｛（［【「『〝⟨「"'>\\\/]+)/);
            //let split = line.split(/((?:^|(?:\r?\n))+ *　*[◎▲▼▽■□●○★☆♥♡♪＿＊－＝＋＃＄―※〇〔〖〘〚〝｢〈《「『【（［＜｛｟"'>\\\/]+)/); //Fantom#9835's list, ty
            let split = line.split(new RegExp(this.getRowStart()));
            // We need to give back the start of the sentence so that it translates correctly
            for (let k = 1; k < split.length - 1; k++) {
                split[k] += split[k+1];
                split.splice(k+1, 1);
            }
            // check for empty lines...
            for (let k = split.length - 1; k >= 0; k--) {
                if (split[k].trim() == "") {
                    split.splice(k, 1);
                }
            }
            lines.splice(i, 1, ...split);
        }
        
        return lines;
    }

    public isScript (brokenRow : Array<string>) : RedScriptCheckResponse {
        let quoteType = "";
        if (this.isKeepingScripts() && brokenRow.length == 1) {
            let trimmed = brokenRow[0].trim();
            if (["'", '"'].indexOf(trimmed.charAt(0)) != -1 && 
                 trimmed.charAt(0) == trimmed.charAt(trimmed.length - 1)
                 ) {
                quoteType = trimmed.charAt(0);

                trimmed = trimmed.substring(1, trimmed.length - 1);
                let innerString = trimmed; // It's never valid JSON. never.
                return {
                    isScript : true,
                    quoteType : quoteType,
                    newLine : innerString
                }
            }
        }
        return {isScript : false}
    }

    public curateRow (row : string) : {
        scriptCheck : RedScriptCheckResponse,
        lines : Array<RedStringEscaper> } {
        let escapingType = this.getEngine().getOptions().escapeAlgorithm || RedPlaceholderType.poleposition;
        let splitEnds = this.getEngine().getOptions().splitEnds;
        splitEnds = splitEnds == undefined ? true : splitEnds === true; // set to true if undefined, check against true if not
        let mergeSymbols = this.isMergingSymbols();

        
        let isolateSymbols = this.getEngine().getOptions().isolateSymbols;
        isolateSymbols = isolateSymbols == undefined ? true : isolateSymbols === true; // set to true if undefined, check against true if not

        let isolateRegExp = this.getEngine().getOptions().isolateRegExp;
        isolateRegExp = isolateRegExp == undefined ? defaultIsolateRegexp : isolateRegExp;

        let lines = this.breakRow(row);
        let scriptCheck = this.isScript(lines);

        if (scriptCheck.isScript) {
            lines = this.breakRow(<string> scriptCheck.newLine);
        }
        
        let curated : Array<RedStringEscaper> = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            let escaped = new RedStringEscaper(line, {
                type : escapingType,
                splitEnds: splitEnds,
                mergeSymbols: mergeSymbols,
                noUnks : true,
                isolateSymbols : isolateSymbols,
                isolateRegExp : isolateRegExp,
            });
            curated.push(escaped);
        }
        return {scriptCheck : scriptCheck,
            lines : curated};
    }

    abstract doTranslate (toTranslate : Array<string>, options : TranslatorEngineOptions) : Promise<Array<string>>;

    public translate (rows : Array<string>, options : any) {
        let batchStart = new Date().getTime();
        options = options||{};
        options.onAfterLoading = options.onAfterLoading||function() {};
        options.onError = options.onError||function() {};
        options.always = options.always||function() {};

        if ((<HTMLElement> document.getElementById("loadingOverlay")).classList.contains("hidden")) {
            ui.showBusyOverlay();
        }
        
        // Unpause if paused
        this.resume(true);
        this.allowTranslation = true;

        // Set up T++ result object
        let result : TranslatorEngineResults = {
			'sourceText':rows.join(), 
			'translationText':"",
			'source':rows, 
			'translation': <Array<string>> []
		};
        
        // First step: curate every single line and keep track of it
        let rowHandlers : Array<RedStringRowHandler> = [];
        let toTranslateOr : Array<string> = [];
        let toTranslate : Array<string> = [];
        let toTranslateIndex : Array<Array<number>> = [];
        for (let i = 0; i < rows.length; i++) {
            let handler = new RedStringRowHandler(rows[i], this);
            rowHandlers.push(handler);
            
            // Second step: separate every line that will need to be translated
            toTranslateOr.push(...handler.getTranslatableLines());
        }

        // Remove all duplicates
        for (let i = 0; i < toTranslateOr.length; i++) {
            let idx = toTranslate.indexOf(toTranslateOr[i]);
            if (idx == -1) {
                toTranslate.push(toTranslateOr[i]);
                toTranslateIndex.push([i]);
            } else {
                // We are already translating this line. Add this to the index.
                toTranslateIndex[idx].push(i);
            }
        }

        // Third step: send translatable lines to the translator handler
        let translation = this.doTranslate(toTranslate, options);

        // After receiving...
        translation.then((translationsNoDupes) => {
            // Recreate translations with duplicates so our old indexes work
            let translations = new Array(toTranslateOr.length);
            for (let i = 0; i < translationsNoDupes.length; i++) {
                for (let k = 0; k < toTranslateIndex[i].length; k++) {
                    translations[toTranslateIndex[i][k]] = translationsNoDupes[i];
                }
            }

            if (translationsNoDupes.length != translations.length) {
                this.log(`[RedTranslatorEngine] Avoided translating ${translations.length - translationsNoDupes.length} duplicate strings.`)
            }

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

            setTimeout(() => {
                options.onAfterLoading.call(this.translatorEngine, result);
            }, 150);
        }).catch((reason) => {
            console.error("[RedTranslatorEngine] Well shit.", reason);
            this.error("[RedTranslatorEngine] Error: ", reason);
        }).finally(() => {
            let batchEnd = new Date().getTime();
            let seconds = Math.round((batchEnd - batchStart)/100)/10;


            this.log(`[RedTranslatorEngine] Batch took: ${seconds} seconds, which was about ${Math.round(10 * result.sourceText.length / seconds)/10} characters per second!`);
            this.log(`[RedTranslatorEngine] Translated ${rows.length} rows (${Math.round(10 * rows.length / seconds)/10} rows per second).`);

            let hits = this.getCacheHits();
            this.resetCacheHits();
            if (hits > 0) {
                this.log(`[RedTranslatorEngine] Skipped ${hits} translations through cache hits!`);
            }

            if ((<HTMLElement> document.getElementById("loadingOverlay")).classList.contains("hidden")) {
                ui.hideBusyOverlay();
            }

            if (this.isPersistentCaching()) {
                this.log("[RedTranslatorEngine] Saving translation cache to file.");
                this.cacheHandler.saveCache();
            }
        });
    }

    public log (...texts : Array<string>) {
        let elements : Array<Text> = [];
        texts.forEach(text => {
            elements.push(document.createTextNode(text));
        });
        this.print(...elements);
    }

    public error (...texts : Array<string>) {
        let elements : Array<Text> = [];
        texts.forEach(text => {
            elements.push(document.createTextNode(text));
        });
        this.printError(...elements);
    }

    public print (...elements : Array<Element | Text>) {
        let consoleWindow = $("#loadingOverlay .console")[0];
        let pre = document.createElement("pre");
        elements.forEach(element => {
            pre.appendChild(element);
        });
        consoleWindow.appendChild(pre);
    }

    public printError (...elements : Array<Element | Text>) {
        let consoleWindow = $("#loadingOverlay .console")[0];
        let pre = document.createElement("pre");
        pre.style.color = "red";
        pre.style.fontWeight = "bold";
        elements.forEach(element => {
            pre.appendChild(element);
        });
        consoleWindow.appendChild(pre);
    }

    public isValidHttpUrl(urlString : string) {
        let url;
        try {
          url = new URL(urlString);
        } catch (_) {
          return false;  
        }
        return url.protocol === "http:" || url.protocol === "https:";
    }

    constructor (thisAddon : any, extraOptions : {[id : string] : any}, extraSchema : {[id : string] : TranslationEngineOptionSchema<any>}, extraForm : Array<TranslationEngineOptionFormUpdater>) {
        this.translatorEngine = new TranslatorEngine({
            author:thisAddon.package.author.name,
            version:thisAddon.package.version,
            ...extraOptions,
            splitEnds : true,
            useCache : true,
            usePersistentCache : true,
            persistentCacheMaxSize : 10,
            detectStrings : true,
            mergeSymbols : true,
            isolateSymbols : true,
            rowStart : defaultLineStart,
            rowEnd : defaultLineEnd,
            isolateRegExp : defaultIsolateRegexp,
            optionsForm:{
              "schema": {
                "splitEnds": {
                    "type": "boolean",
                    "title": "Split Ends",
                    "description": "Escaped symbols at the very corners of sentences will not be sent to the translator. This improves translation quality by a lot when these symbols have no meaning (e.g. escaped brackets, something outside the sentence). Recommended is ON for most messages, OFF for RPG Maker MV vocab.",
                    "default":true
                },
                "isolateSymbols": {
                    "type": "boolean",
                    "title": "Isolate Symbols",
                    "description": "Escapes and isolates text contained inside brackets/quotes/etc. This is useful to maintain consistency of a recurring term. Recommended is ON, but do check if the RegExp escapes any variable calls your engine uses.",
                    "default":true
                },
                "useCache": {
                    "type": "boolean",
                    "title": "Use Cache",
                    "description": "Cache every translator response to memory so that the work doesn't get repeated. There are no downsides to this. Recommended is ON.",
                    "default":true
                },
                "usePersistentCache": {
                    "type": "boolean",
                    "title": "Use Persistent Cache",
                    "description": "Saves the cache to disk between translations. There is no downside to this. Recommended is ON.",
                    "default":true
                },
                "persistentCacheMaxSize": {
                    "type": "number",
                    "title": "Persistent Cache Maximum Size",
                    "description": "The maximum size of the cache, both for in-memory and persistent, in Megabytes. A medium length game will take about 3MB. This can be as big as you'd like - just keep in mind disk/memory usage.",
                    "default":10,
                    "required":true
                },
                "detectStrings": {
                    "type": "boolean",
                    "title": "Literal String Detection",
                    "description": "Attempts to detect and correct literal strings (text enclosed by quotes). Because most engines don't use valid JSON, this is very rudimentary and simply makes sure quotes are still where they should be and any inner quotes are properly escaped. Anything else is left for god to sort out.",
                    "default":true
                },
                "mergeSymbols": {
                   "type": "boolean",
                   "title": "Merge Escaped Symbols",
                   "description": "If there are two sequential escaped symbols, they are escaped into a single symbol. There are no downsides to this. Recommended is ON.",
                   "default":true
               },
               ...extraSchema,
                "rowStart": {
                     "type": "string",
                     "title": "Line Start Detection",
                     "description": "This Regular Expression is used by the text processor to detect new lines. It is not recommended to change this value.",
                     "default": defaultLineStart,
                     "required":true
                 },
                 "rowEnd": {
                      "type": "string",
                      "title": "Line End Detection",
                      "description": "This Regular Expression is used by the text processor to detect where lines end. It is not recommended to change this value.",
                      "default": defaultLineEnd,
                      "required":true
                  },
                  "isolateRegExp": {
                       "type": "string",
                       "title": "Isolate Symbols",
                       "description": "This regular expression is used to detect Symbols and isolate them to translate separatedly. It is not recommended to change this value.",
                       "default": defaultIsolateRegexp,
                       "required":true
                   },
              },
              "form": [
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
                },
                {
                    "key": "usePersistentCache",
                    "inlinetitle": "Use Persistent Cache",
                    "onChange": (evt : Event) => {
                      var value = $(<HTMLInputElement> evt.target).prop("checked");
                      this.translatorEngine.update("usePersistentCache", value);
                    }
                },
                {
                    "key": "persistentCacheMaxSize",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      this.translatorEngine.update("persistentCacheMaxSize", parseFloat(value));
                    }
                },
                {
                    "key": "detectStrings",
                    "inlinetitle": "Literal String Detection",
                    "onChange": (evt : Event) => {
                      var value = $(<HTMLInputElement> evt.target).prop("checked");
                      this.translatorEngine.update("detectStrings", value);
                    }
                },
                {
                    "key": "mergeSymbols",
                    "inlinetitle": "Merge Escaped Symbols",
                    "onChange": (evt : Event) => {
                      var value = $(<HTMLInputElement> evt.target).prop("checked");
                      this.translatorEngine.update("detectStrings", value);
                    }
                },
                {
                    "key": "isolateSymbols",
                    "inlinetitle": "Isolate Symbols",
                    "onChange": (evt : Event) => {
                      var value = $(<HTMLInputElement> evt.target).prop("checked");
                      this.translatorEngine.update("isolateSymbols", value);
                    }
                },
                ...extraForm,
                {
                    "key": "rowStart",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      this.translatorEngine.update("rowStart", value);
                    }
                },
                {
                    "key": "rowEnd",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      this.translatorEngine.update("rowEnd", value);
                    }
                },
                {
                    "key": "isolateRegExp",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      this.translatorEngine.update("isolateRegExp", value);
                    }
                },
                {
                    "type": "actions",
                    "title" : "Reset RegExps",
                    "fieldHtmlClass": "actionButtonSet",
                    "items": [
                        {
                          "type": "button",
                          "title": "Reset RegExps to their default values",
                          "onClick" : (evt : any) => {
                              try {
                                  (<any> window).clicked = evt;
                                  var optionWindow = $((evt.target).parentNode.parentNode);
                                  let engine = <any> this.getEngine();
                                  optionWindow.find(`[name="rowStart"]`).val(defaultLineStart);
                                  optionWindow.find(`[name="rowEnd"]`).val(defaultLineEnd);
                                  optionWindow.find(`[name="isolateRegExp"]`).val(defaultIsolateRegexp);
                                  engine.update("isolateRegExp", defaultIsolateRegexp);
                                  engine.update("rowStart", defaultLineStart);
                                  engine.update("rowEnd", defaultLineEnd);
                              } catch (e) {
                                  alert("Failed!" + (<Error> e).message);
                              }
                          }
                        },
                        {
                          "type": "button",
                          "title": "Empty Cache (use if the translator is updated with better translations)",
                          "onClick" : () => {
                              this.cacheHandler.resetCache();
                              this.cacheHandler.saveCache();
                          }
                        }
                    ]
                },
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

        this.cacheHandler = new RedPersistentCacheHandler(extraOptions.id);
        this.cacheHandler.loadCache();
    }
}