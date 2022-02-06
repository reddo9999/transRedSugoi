/// <reference path="RedStringEscaper.ts" />
declare var ui : any;

interface RedScriptCheckResponse {
    isScript : boolean;
    quoteType? : string;
    newLine? : string;
}

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
    // Cache Translations so we can save up time!
    // In most scenarios this will not help, but if there is a consistent string reuse it might.
    // e.g. CharacterName: at the start of every Dialogue.
    // Plus not redoing the work is just good practice.
    // Would it be worth it to save this to a file and keep updating it through multiple games?
    // The bigger it gets the slower it should be to access, but wouldn't it still be faster than repeating the work?
    protected translationCache : {[text : string] : string} = {};

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

    private cacheHits = 0;

    public hasCache (text : string) {
        return this.translationCache[text] != undefined;
    }

    public getCache (text : string) {
        this.cacheHits++;
        return this.translationCache[text];
    }

    public setCache (text : string, translation : string) {
        this.translationCache[text] = translation;
    }

    public getCacheHits () {
        let result = this.cacheHits;
        this.cacheHits = 0;
        return result;
    }

    public breakRow (text : string) : Array<string> {
        // now we need to prepare the stuff we'll send over to Sugoi.
        // Some games might have rolling text which is far too big to translate at once. This kills the sugoi.
        // probably the best way to detect those is through blank lines.
        // Might be a good idea to also split if new lines start with something that we're escaping


        // First Step = "Break if you find one or more empty lines"
        let lines = text.split(/( *\r?\n(?:\r?\n)+ *)/);

        // Second Step = "Break if a line ends with something that finishes a sentence"
        for (let i = lines.length - 1; i >= 0; i--) {
            let line = lines[i];
            let split = line.split(/([｝）］】」』〟⟩！？。・…‥："'\.\?\!;:]+ *\r?\n)/);
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
            let split = line.split(/((?:^|(?:\r?\n))+ *[｛（［【「『〝⟨「"'>\\\/]+)/);
            // We need to give back the start of the sentence so that it translates correctly
            for (let k = 1; k < split.length - 1; k++) {
                split[k] += split[k+1];
                split.splice(k+1, 1);
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
                // sure looks like one, but is it?
                try {
                    quoteType = trimmed.charAt(0);
                    if (quoteType == "'") {
                        // These are actually invalid, so... extra work for us.
                        trimmed = trimmed.replaceAll('"', '\\"');
                        trimmed = '"' + trimmed.substring(1, trimmed.length - 1) + '"';
                        // It's okay, we'll go back to the original quoteType later.
                    }
                    let innerString = JSON.parse(trimmed);
                    return {
                        isScript : true,
                        quoteType : quoteType,
                        newLine : innerString
                    }
                } catch (e) {
                    console.warn("[REDSUGOI] I thought it was a script but it wasn't. Do check.", brokenRow[0], e);
                }
            }
        }
        return {isScript : false}
    }

    public curateRow (row : string) : Array<RedStringEscaper> {
        let escapingType = this.getEngine().getOptions().escapeAlgorithm || RedPlaceholderType.poleposition;
        let splitEnds = this.getEngine().getOptions().splitEnds;
        splitEnds = splitEnds == undefined ? true : splitEnds === true; // set to true if undefined, check against true if not
        let mergeSymbols = this.isMergingSymbols();

        let lines = this.breakRow(row);
        let scriptCheck = this.isScript(lines);
        
        let curated : Array<RedStringEscaper> = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            let escaped = new RedStringEscaper(line, scriptCheck, escapingType, splitEnds, mergeSymbols, true);
            curated.push(escaped);
        }
        return curated;
    }

    abstract doTranslate (toTranslate : Array<string>, options : TranslatorEngineOptions) : Promise<Array<string>>;

    public translate (rows : Array<string>, options : any) {
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
        let toTranslate : Array<string> = [];
        for (let i = 0; i < rows.length; i++) {
            let handler = new RedStringRowHandler(rows[i], this);
            rowHandlers.push(handler);
            
            // Second step: separate every line that will need to be translated
            toTranslate.push(...handler.getTranslatableLines());
        }

        // Third step: send translatable lines to the translator handler
        let translation = this.doTranslate(toTranslate, options);

        // After receiving...
        translation.then((translations) => {
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

            options.onAfterLoading.call(this.translatorEngine, result);
        }).catch((reason) => {
            console.error("[RedTranslatorEngine] Well shit.", reason);
        }).finally(() => {
            if ((<HTMLElement> document.getElementById("loadingOverlay")).classList.contains("hidden")) {
                ui.hideBusyOverlay();
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
        let escapingTitleMap : {[id : string] : string} = RedPlaceholderTypeNames;

        this.translatorEngine = new TranslatorEngine({
            author:thisAddon.package.author.name,
            version:thisAddon.package.version,
            ...extraOptions,
            escapeAlgorithm : RedPlaceholderType.poleposition,
            splitEnds : true,
            useCache : true,
            detectStrings : true,
            mergeSymbols : true,
            optionsForm:{
              "schema": {
                "escapeAlgorithm": {
                  "type": "string",
                  "title": "Code Escaping Algorithm",
                  "description": "Escaping algorithm used for the Custom Escaper Patterns. For Sugoi Translator, it is recommended to use Poleposition Placeholder, which replaces symbols with a hashtag followed by a short number. For Google, it is recommended to use Tag placeholder.",
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
                    "description": "To improve speed, every translation sent to Sugoi Translator will be stored in case the same sentence appears again. Depending on the game, this can range from 0% gains to over 50%. There are no downsides, but in case you want to test the translator itself this is left as an option. The cache only lasts until you close Translator++. Recommended is ON.",
                    "default":true
                },
                "detectStrings": {
                    "type": "boolean",
                    "title": "Literal String Detection",
                    "description": "Attempts to detect literal strings and safeguards them so that they don't stop being strings after translation. Heavily recommended to be ON, particularly if translating scripts.",
                    "default":true
                },
                "mergeSymbols": {
                   "type": "boolean",
                   "title": "Merge Escaped Symbols",
                   "description": "Essentially escapes sequential escaped symbols so that instead of sending multiple of them and hoping the translator doesn't ruin them all, we just send one and still hope the translator doesn't ruin it all. There should never be issues with this being ON.",
                   "default":true
               },
               ...extraSchema
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
                ...extraForm
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