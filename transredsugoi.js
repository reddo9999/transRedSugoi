"use strict";
var RedPlaceholderType;
(function (RedPlaceholderType) {
    RedPlaceholderType["poleposition"] = "poleposition";
    RedPlaceholderType["hexPlaceholder"] = "hexPlaceholder";
    RedPlaceholderType["noEscape"] = "noEscape";
    RedPlaceholderType["ninesOfRandomness"] = "ninesOfRandomness";
    RedPlaceholderType["tagPlaceholder"] = "tagPlaceholder";
    RedPlaceholderType["closedTagPlaceholder"] = "closedTagPlaceholder";
    RedPlaceholderType["fullTagPlaceholder"] = "fullTagPlaceholder";
    RedPlaceholderType["curlie"] = "curlie";
    RedPlaceholderType["doubleCurlie"] = "doubleCurlie";
})(RedPlaceholderType || (RedPlaceholderType = {}));
var RedPlaceholderTypeNames;
(function (RedPlaceholderTypeNames) {
    RedPlaceholderTypeNames["poleposition"] = "Poleposition (e.g. #24)";
    RedPlaceholderTypeNames["hexPlaceholder"] = "Hex Placeholder (e.g. 0xffffff)";
    RedPlaceholderTypeNames["noEscape"] = "No escaping (will translate everything)";
    RedPlaceholderTypeNames["ninesOfRandomness"] = "Closed Nines (e.g. 9123412349)";
    RedPlaceholderTypeNames["tagPlaceholder"] = "Tag Placeholder (e.g. &lt;24&gt;)";
    RedPlaceholderTypeNames["closedTagPlaceholder"] = "Tag Placeholder Closed Tags (e.g. &lt;24/&gt;)";
    RedPlaceholderTypeNames["fullTagPlaceholder"] = "Tag Placeholder Full XML-style Tag (e.g. &lt;24&gt;&lt;/24&gt;)";
    RedPlaceholderTypeNames["curlie"] = "Curlies (e.g. letter enclosed by curly brackets)";
    RedPlaceholderTypeNames["doubleCurlie"] = "Double Curlies (e.g. letter enclosed by two curly brackets on each side)";
})(RedPlaceholderTypeNames || (RedPlaceholderTypeNames = {}));
let RedPlaceholderTypeArray = [
    RedPlaceholderType.poleposition,
    RedPlaceholderType.hexPlaceholder,
    RedPlaceholderType.noEscape,
    RedPlaceholderType.ninesOfRandomness,
    RedPlaceholderType.tagPlaceholder,
    RedPlaceholderType.closedTagPlaceholder,
    RedPlaceholderType.fullTagPlaceholder,
    RedPlaceholderType.curlie,
    RedPlaceholderType.doubleCurlie,
];
let escapingTitleMap = RedPlaceholderTypeNames;
class RedStringEscaper {
    constructor(text, scriptCheck, type, splitEnds, mergeSymbols, noUnks) {
        this.type = RedPlaceholderType.poleposition;
        this.splitEnds = true;
        this.removeUnks = true;
        this.mergeSymbols = true;
        this.symbolAffix = 1;
        this.currentSymbol = 4;
        this.hexCounter = 983041;
        this.closedNinesLength = 7;
        this.storedSymbols = {};
        this.reverseSymbols = {};
        this.broken = false;
        this.curlyCount = 65;
        this.preString = "";
        this.postString = "";
        this.isScript = false;
        this.quoteType = "";
        this.text = text;
        this.currentText = text;
        this.type = type || RedPlaceholderType.poleposition;
        this.splitEnds = splitEnds == true;
        this.removeUnks = noUnks == true;
        this.mergeSymbols = mergeSymbols == true;
        this.isScript = scriptCheck.isScript;
        if (this.isScript) {
            this.quoteType = scriptCheck.quoteType;
            this.currentText = scriptCheck.newLine;
        }
        this.escape();
    }
    break() {
        this.broken = true;
    }
    getTag() {
        return `<${this.symbolAffix++}${this.currentSymbol++}>`;
    }
    getClosedTag() {
        return `<${this.symbolAffix++}${this.currentSymbol++}/>`;
    }
    getFullTag() {
        let contents = `${this.symbolAffix++}${this.currentSymbol++}`;
        return `<${contents}></${contents}>`;
    }
    getPolePosition() {
        return `#${this.symbolAffix++}${this.currentSymbol++}`;
    }
    getHexPlaceholder() {
        return "0x" + (this.hexCounter++).toString(16);
    }
    getCurly() {
        return "{" + String.fromCharCode(this.curlyCount++) + "}";
    }
    getDoubleCurly() {
        return "{{" + String.fromCharCode(this.curlyCount++) + "}}";
    }
    getClosedNines() {
        return "9" +
            Array.from({ length: this.closedNinesLength }, () => Math.floor(Math.random() * 10).toString()).join("")
            + "9";
    }
    storeSymbol(text) {
        if (this.reverseSymbols[text] != undefined) {
            return this.reverseSymbols[text];
        }
        else {
            let tag = "Invalid Placeholder Style";
            switch (this.type) {
                case RedPlaceholderType.poleposition:
                    tag = this.getPolePosition();
                    break;
                case RedPlaceholderType.hexPlaceholder:
                    tag = this.getHexPlaceholder();
                    break;
                case RedPlaceholderType.noEscape:
                    tag = text;
                    break;
                case RedPlaceholderType.ninesOfRandomness:
                    tag = this.getClosedNines();
                    break;
                case RedPlaceholderType.tagPlaceholder:
                    tag = this.getTag();
                    break;
                case RedPlaceholderType.fullTagPlaceholder:
                    tag = this.getFullTag();
                    break;
                case RedPlaceholderType.closedTagPlaceholder:
                    tag = this.getClosedTag();
                    break;
                case RedPlaceholderType.curlie:
                    tag = this.getCurly();
                    break;
                case RedPlaceholderType.doubleCurlie:
                    tag = this.getDoubleCurly();
                    break;
            }
            this.storedSymbols[tag.trim()] = text;
            this.reverseSymbols[text] = tag.trim();
            return tag;
        }
    }
    getOriginalText() {
        return this.text;
    }
    getReplacedText() {
        if (this.broken) {
            return "";
        }
        return this.currentText;
    }
    setTranslatedText(text) {
        this.currentText = text;
    }
    recoverSymbols() {
        if (this.broken) {
            return "";
        }
        this.currentText = this.preString + this.currentText + this.postString;
        let found = true;
        while (found) {
            found = false;
            for (let key in this.storedSymbols) {
                let idx = this.currentText.indexOf(key);
                while (idx != -1) {
                    found = true;
                    this.currentText = this.currentText.substring(0, idx) +
                        this.storedSymbols[key] +
                        this.currentText.substring(idx + key.length);
                    idx = this.currentText.indexOf(key);
                }
            }
        }
        if (this.removeUnks) {
            this.currentText = this.currentText.replaceAll("<unk>", "");
        }
        if (this.isScript) {
            this.currentText = JSON.stringify(this.currentText);
            if (this.currentText.charAt(0) != this.quoteType) {
                this.currentText = this.currentText.replaceAll(this.quoteType, `\\${this.quoteType}`);
                this.currentText = this.quoteType + this.currentText.substring(1, this.currentText.length - 1) + this.quoteType;
            }
        }
        return this.currentText;
    }
    escape() {
        if (this.type == RedPlaceholderType.noEscape) {
            this.currentText = this.text;
            return this.text;
        }
        let formulas = RedStringEscaper.getActiveFormulas();
        let text = this.currentText || this.text;
        for (var i = 0; i < formulas.length; i++) {
            if (!Boolean(formulas[i]))
                continue;
            if (typeof formulas[i] == 'function') {
                var arrayStrings = formulas[i].call(this, text);
                if (typeof arrayStrings == 'string')
                    arrayStrings = [arrayStrings];
                if (Array.isArray(arrayStrings) == false)
                    continue;
                for (var x in arrayStrings) {
                    text = text.replaceAll(arrayStrings[x], (match) => {
                        return this.storeSymbol(match);
                    });
                }
            }
            else {
                text = text.replaceAll(formulas[i], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }
        this.currentText = this.currentText.trim();
        let found = true;
        while (found && this.splitEnds) {
            found = false;
            for (let tag in this.storedSymbols) {
                let idx = text.indexOf(tag);
                if (idx == 0) {
                    this.preString += this.storedSymbols[tag];
                    text = text.substring(tag.length);
                    found = true;
                }
                else if (idx != -1 && (idx + tag.length) == text.length) {
                    this.postString = this.storedSymbols[tag] + this.postString;
                    text = text.substring(0, idx);
                    found = true;
                }
            }
        }
        if (this.mergeSymbols) {
            let regExpObj = {};
            regExpObj[RedPlaceholderType.poleposition] = /((?:#[0-9]+){2,})/g;
            regExpObj[RedPlaceholderType.hexPlaceholder] = /((?:0x[0-9a-fA-F]+){2,})/g;
            regExpObj[RedPlaceholderType.tagPlaceholder] = /((?:<[0-9]{2,}>){2,})/g;
            regExpObj[RedPlaceholderType.closedTagPlaceholder] = /((?:<[0-9]{2,}\/>){2,})/g;
            regExpObj[RedPlaceholderType.ninesOfRandomness] = new RegExp("((?:9[0-9]{" + this.closedNinesLength + ",}9){2,})", "g");
            regExpObj[RedPlaceholderType.fullTagPlaceholder] = /((?:<[0-9]{2,}><\/[0-9]{2,}>){2,})/g;
            regExpObj[RedPlaceholderType.curlie] = /((?:{[A-Z]+}){2,})/g;
            regExpObj[RedPlaceholderType.doubleCurlie] = /((?:{{[A-Z]+}){2,}})/g;
            if (regExpObj[this.type] != undefined) {
                text = text.replaceAll(regExpObj[this.type], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }
        this.currentText = text;
        return text;
    }
    static getActiveFormulas() {
        sys.config.escaperPatterns = sys.config.escaperPatterns || [];
        if (RedStringEscaper.cachedFormulaString == JSON.stringify(sys.config.escaperPatterns)) {
            return RedStringEscaper.cachedFormulas;
        }
        let formulas = [];
        for (var i in sys.config.escaperPatterns) {
            if (typeof sys.config.escaperPatterns[i] !== "object")
                continue;
            if (!sys.config.escaperPatterns[i].value)
                continue;
            try {
                var newReg;
                if (common.isRegExp(sys.config.escaperPatterns[i].value)) {
                    newReg = common.evalRegExpStr(sys.config.escaperPatterns[i].value);
                }
                else if (common.isStringFunction(sys.config.escaperPatterns[i].value)) {
                    newReg = RedStringEscaper.renderFunction(sys.config.escaperPatterns[i].value);
                }
                else {
                    newReg = JSON.parse(sys.config.escaperPatterns[i].value);
                }
                if (newReg != undefined) {
                    formulas.push(newReg);
                }
            }
            catch (e) {
                console.warn("[RedStringEscaper] Error Trying to render Escaper Pattern ", sys.config.escaperPatterns[i], e);
            }
        }
        RedStringEscaper.cachedFormulaString = JSON.stringify(sys.config.escaperPatterns);
        RedStringEscaper.cachedFormulas = formulas;
        return formulas;
    }
    static renderFunction(string) {
        try {
            var func = eval("[" + string + "]");
            return func[0];
        }
        catch (e) {
            console.error("[TAGPLACEHOLDER] Error rendering function", e);
            return false;
        }
    }
}
RedStringEscaper.cachedFormulaString = "";
RedStringEscaper.cachedFormulas = [];
window.RedStringEscaper = RedStringEscaper;
class RedTranslatorEngineWrapper {
    constructor(thisAddon, extraOptions, extraSchema, extraForm) {
        this.urls = [];
        this.urlUsage = [];
        this.urlScore = [];
        this.allowTranslation = true;
        this.paused = false;
        this.waiting = [];
        this.translationCache = {};
        this.cacheHits = 0;
        this.translatorEngine = new TranslatorEngine({
            author: thisAddon.package.author.name,
            version: thisAddon.package.version,
            ...extraOptions,
            escapeAlgorithm: RedPlaceholderType.poleposition,
            splitEnds: true,
            useCache: true,
            detectStrings: true,
            mergeSymbols: true,
            optionsForm: {
                "schema": {
                    "splitEnds": {
                        "type": "boolean",
                        "title": "Split Ends",
                        "description": "For added compatibility, symbols that begin or end sentences will not be sent to the translator. This deprives the translator from contextual information, but guarantees the symbol will not be lost nor misplaced. If the symbols at the corners are not actually part of the text this will actually improve translation accuracy while also increasing speed. Recommended is ON.",
                        "default": true
                    },
                    "useCache": {
                        "type": "boolean",
                        "title": "Use Cache",
                        "description": "To improve speed, every translation sent to Sugoi Translator will be stored in case the same sentence appears again. Depending on the game, this can range from 0% gains to over 50%. There are no downsides, but in case you want to test the translator itself this is left as an option. The cache only lasts until you close Translator++. Recommended is ON.",
                        "default": true
                    },
                    "detectStrings": {
                        "type": "boolean",
                        "title": "Literal String Detection",
                        "description": "Attempts to detect literal strings and safeguards them so that they don't stop being strings after translation. Heavily recommended to be ON, particularly if translating scripts.",
                        "default": true
                    },
                    "mergeSymbols": {
                        "type": "boolean",
                        "title": "Merge Escaped Symbols",
                        "description": "Essentially escapes sequential escaped symbols so that instead of sending multiple of them and hoping the translator doesn't ruin them all, we just send one and still hope the translator doesn't ruin it all. There should never be issues with this being ON.",
                        "default": true
                    },
                    ...extraSchema
                },
                "form": [
                    {
                        "key": "escapeAlgorithm",
                        "titleMap": escapingTitleMap,
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("escapeAlgorithm", value);
                        }
                    },
                    {
                        "key": "splitEnds",
                        "inlinetitle": "Cut Corners",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("splitEnds", value);
                        }
                    },
                    {
                        "key": "useCache",
                        "inlinetitle": "Use Cache",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("useCache", value);
                        }
                    },
                    {
                        "key": "detectStrings",
                        "inlinetitle": "Literal String Detection",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("detectStrings", value);
                        }
                    },
                    {
                        "key": "mergeSymbols",
                        "inlinetitle": "Merge Escaped Symbols",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("detectStrings", value);
                        }
                    },
                    ...extraForm
                ]
            }
        });
        this.translatorEngine.translate = (text, options) => {
            this.translate(text, options);
        };
        this.translatorEngine.abort = () => {
            this.abort();
        };
        this.translatorEngine.pause = () => {
            this.pause();
        };
        this.translatorEngine.resume = () => {
            this.resume();
        };
    }
    getEngine() {
        return this.translatorEngine;
    }
    abort() {
        this.allowTranslation = false;
        this.waiting = [];
        this.paused = false;
    }
    pause() {
        this.paused = true;
    }
    resume(reset) {
        this.paused = false;
        if (reset == true) {
            this.waiting = [];
        }
        else {
            this.waiting.forEach(callback => {
                callback();
            });
            this.waiting = [];
        }
    }
    isCaching() {
        let useCache = this.getEngine().getOptions().useCache;
        return useCache == undefined ? true : useCache == true;
    }
    isKeepingScripts() {
        let detectStrings = this.getEngine().getOptions().detectStrings;
        return detectStrings == undefined ? true : detectStrings == true;
    }
    isMergingSymbols() {
        let mergeSymbols = this.getEngine().getOptions().mergeSymbols;
        return mergeSymbols == undefined ? true : mergeSymbols == true;
    }
    hasCache(text) {
        return this.translationCache[text] != undefined;
    }
    getCache(text) {
        this.cacheHits++;
        return this.translationCache[text];
    }
    setCache(text, translation) {
        this.translationCache[text] = translation;
    }
    getCacheHits() {
        let result = this.cacheHits;
        this.cacheHits = 0;
        return result;
    }
    breakRow(text) {
        let lines = text.split(/( *\r?\n(?:\r?\n)+ *)/);
        for (let i = lines.length - 1; i >= 0; i--) {
            let line = lines[i];
            let split = line.split(/([｝）］】」』〟⟩！？。・…‥："'\.\?\!;:]+ *\r?\n)/);
            for (let k = 0; k < split.length - 1; k++) {
                split[k] += split[k + 1];
                split.splice(k + 1, 1);
            }
            lines.splice(i, 1, ...split);
        }
        for (let i = lines.length - 1; i >= 0; i--) {
            let line = lines[i];
            let split = line.split(/((?:^|(?:\r?\n))+ *[｛（［【「『〝⟨「"'>\\\/]+)/);
            for (let k = 1; k < split.length - 1; k++) {
                split[k] += split[k + 1];
                split.splice(k + 1, 1);
            }
            lines.splice(i, 1, ...split);
        }
        return lines;
    }
    isScript(brokenRow) {
        let quoteType = "";
        if (this.isKeepingScripts() && brokenRow.length == 1) {
            let trimmed = brokenRow[0].trim();
            if (["'", '"'].indexOf(trimmed.charAt(0)) != -1 &&
                trimmed.charAt(0) == trimmed.charAt(trimmed.length - 1)) {
                try {
                    quoteType = trimmed.charAt(0);
                    if (quoteType == "'") {
                        trimmed = trimmed.replaceAll('"', '\\"');
                        trimmed = '"' + trimmed.substring(1, trimmed.length - 1) + '"';
                    }
                    let innerString = JSON.parse(trimmed);
                    return {
                        isScript: true,
                        quoteType: quoteType,
                        newLine: innerString
                    };
                }
                catch (e) {
                    console.warn("[REDSUGOI] I thought it was a script but it wasn't. Do check.", brokenRow[0], e);
                }
            }
        }
        return { isScript: false };
    }
    curateRow(row) {
        let escapingType = this.getEngine().getOptions().escapeAlgorithm || RedPlaceholderType.poleposition;
        let splitEnds = this.getEngine().getOptions().splitEnds;
        splitEnds = splitEnds == undefined ? true : splitEnds === true;
        let mergeSymbols = this.isMergingSymbols();
        let lines = this.breakRow(row);
        let scriptCheck = this.isScript(lines);
        let curated = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            let escaped = new RedStringEscaper(line, scriptCheck, escapingType, splitEnds, mergeSymbols, true);
            curated.push(escaped);
        }
        return curated;
    }
    translate(rows, options) {
        options = options || {};
        options.onAfterLoading = options.onAfterLoading || function () { };
        options.onError = options.onError || function () { };
        options.always = options.always || function () { };
        if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
            ui.showBusyOverlay();
        }
        this.resume(true);
        this.allowTranslation = true;
        let result = {
            'sourceText': rows.join(),
            'translationText': "",
            'source': rows,
            'translation': []
        };
        let rowHandlers = [];
        let toTranslate = [];
        for (let i = 0; i < rows.length; i++) {
            let handler = new RedStringRowHandler(rows[i], this);
            rowHandlers.push(handler);
            toTranslate.push(...handler.getTranslatableLines());
        }
        let translation = this.doTranslate(toTranslate, options);
        translation.then((translations) => {
            let curatedIndex = 0;
            let internalIndex = 0;
            let finalTranslations = [];
            let curated = rowHandlers[curatedIndex];
            let moveRows = () => {
                while (curated != undefined && curated.isDone(internalIndex)) {
                    curated.applyTranslation();
                    finalTranslations.push(curated.getTranslatedRow());
                    internalIndex = 0;
                    curated = rowHandlers[++curatedIndex];
                }
            };
            moveRows();
            for (let outerIndex = 0; outerIndex < translations.length; outerIndex++) {
                let translation = translations[outerIndex];
                curated = rowHandlers[curatedIndex];
                curated.insertTranslation(translation, internalIndex++);
                moveRows();
            }
            result.translation = finalTranslations;
            result.translationText = finalTranslations.join("\n");
            options.onAfterLoading.call(this.translatorEngine, result);
        }).catch((reason) => {
            console.error("[RedTranslatorEngine] Well shit.", reason);
        }).finally(() => {
            if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
                ui.hideBusyOverlay();
            }
        });
    }
    log(...texts) {
        let elements = [];
        texts.forEach(text => {
            elements.push(document.createTextNode(text));
        });
        this.print(...elements);
    }
    error(...texts) {
        let elements = [];
        texts.forEach(text => {
            elements.push(document.createTextNode(text));
        });
        this.printError(...elements);
    }
    print(...elements) {
        let consoleWindow = $("#loadingOverlay .console")[0];
        let pre = document.createElement("pre");
        elements.forEach(element => {
            pre.appendChild(element);
        });
        consoleWindow.appendChild(pre);
    }
    printError(...elements) {
        let consoleWindow = $("#loadingOverlay .console")[0];
        let pre = document.createElement("pre");
        pre.style.color = "red";
        pre.style.fontWeight = "bold";
        elements.forEach(element => {
            pre.appendChild(element);
        });
        consoleWindow.appendChild(pre);
    }
    isValidHttpUrl(urlString) {
        let url;
        try {
            url = new URL(urlString);
        }
        catch (_) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
    }
}
class RedSugoiEngine extends RedTranslatorEngineWrapper {
    getUrl() {
        this.updateUrls();
        let idx = this.urlUsage.indexOf(Math.min(...this.urlUsage));
        this.urlUsage[idx]++;
        this.urlScore[idx]++;
        return this.urls[idx];
    }
    reduceScore(url) {
        let idx = this.urls.indexOf(url);
        if (idx != -1) {
            this.urlScore[idx]--;
        }
    }
    updateUrls() {
        let thisEngine = this.translatorEngine;
        let urls = thisEngine.targetUrl.replaceAll("\r", "").split("\n");
        if (this.urls.length != urls.length) {
            this.urls = [...urls];
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
    getUrlCount() {
        if (this.urls.length == 0) {
            this.updateUrls();
        }
        return this.urls.length;
    }
    freeUrl(url) {
        this.urlUsage[this.urls.indexOf(url)]--;
    }
    resetScores() {
        this.urlScore = new Array(this.urls.length).fill(0);
    }
    doTranslate(toTranslate, options) {
        this.resetScores();
        console.log("[REDSUGOI] TRANSLATE:\n", toTranslate, options);
        let batchStart = new Date().getTime();
        let translating = 0;
        let translations = [];
        let consoleWindow = $("#loadingOverlay .console")[0];
        let progressTotal = document.createTextNode("/" + toTranslate.length.toString());
        let pre = document.createElement("pre");
        let progressNode = document.createTextNode("0");
        pre.appendChild(document.createTextNode("[RedSugoi] Translating current batch: "));
        pre.appendChild(progressNode);
        pre.appendChild(progressTotal);
        let crashDetector = document.createTextNode("");
        let spinny = "/-\\|/-\\|";
        let spinnyi = 0;
        pre.appendChild(crashDetector);
        consoleWindow.appendChild(pre);
        let translatedLines = 0;
        let spinnyInterval = setInterval(() => {
            spinnyi = (spinnyi + 1) % spinny.length;
            crashDetector.nodeValue = " " + spinny.charAt(spinnyi);
        }, 100);
        console.log("[RedSugoi] Translations to send:", toTranslate);
        let updateProgress = () => {
            progressNode.nodeValue = (translatedLines).toString();
            progressTotal.nodeValue = "/" + toTranslate.length.toString();
        };
        let maximumPayload = this.getEngine().getOptions().maxParallelJob || 5;
        let threads = this.getEngine().getOptions().threads || 1;
        let completedThreads = 0;
        this.updateUrls();
        let totalThreads = this.getUrlCount() * threads;
        let complete;
        let doTranslate = (onSuccess, onError) => {
            if (!this.allowTranslation || this.paused) {
                return this.waiting.push(() => {
                    doTranslate(onSuccess, onError);
                });
            }
            if (translating >= toTranslate.length) {
                console.log("[RedSugoi] Thread has no more work to do.");
                complete(onSuccess, onError);
            }
            else {
                console.log("[RedSugoi] Thread Starting Work.");
                let myLines = [];
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
                    method: 'post',
                    body: JSON.stringify({ content: myLines, message: "translate sentences" }),
                    headers: { 'Content-Type': 'application/json' },
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
                    }
                    else {
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
        };
        complete = (onSuccess, onError) => {
            if (++completedThreads == totalThreads) {
                crashDetector.nodeValue = "";
                clearInterval(spinnyInterval);
                onSuccess(translations);
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
                let seconds = Math.round((batchEnd - batchStart) / 100) / 10;
                pre.appendChild(document.createTextNode(`\n[RedSugoi] Batch took: ${seconds} seconds, which was about ${Math.round(10 * toTranslate.join("").length / seconds) / 10} characters per second!`));
                pre.appendChild(document.createTextNode(`\n[RedSugoi] We skipped ${this.getCacheHits()} translations through cache hits!`));
                consoleWindow.appendChild(pre);
            }
        };
        return new Promise((onSuccess, onError) => {
            for (let i = 0; i < totalThreads; i++) {
                doTranslate(onSuccess, onError);
            }
        });
    }
    constructor(thisAddon) {
        super(thisAddon, {
            id: "redsugoi",
            name: "Red Sugoi Translator",
            targetUrl: "http://localhost:14366/",
            languages: {
                "en": "English",
                "ja": "Japanese"
            },
            description: thisAddon.package.description,
            batchDelay: 1,
            skipReferencePair: true,
            lineDelimiter: "<br>",
            mode: "rowByRow",
            maxRequestLength: Number.MAX_VALUE,
            maxParallelJob: 5,
            threads: 1,
        }, {
            "targetUrl": {
                "type": "string",
                "title": "Target URL(s)",
                "description": "Sugoi Translator target URL. If you have multiple servers, you can put one in each line. IMPORTANT: This is not updated by the default Sugoi Translator plugin! You need to set it up separatedly!",
                "default": "http://localhost:14366/",
                "required": true
            },
            "maxParallelJob": {
                "type": "number",
                "title": "Max Parallel job",
                "description": "The amount of translations that are sent to the server per request. Sweet spot will vary with hardware. In general, the bigger the number, the faster it goes - provided you have enough RAM/VRAM. Lower numbers should be used with multiple servers for effective load balancing.",
                "default": 5,
                "required": true
            },
            "threads": {
                "type": "number",
                "title": "Threads",
                "description": "The amount of requests that are sent per server. This can be used to combat latency between Translator++ making a request and waiting on the answer, resulting in less idle time for the servers. This is a per-server setting, so if you have three servers and three threads, that's 3 requests per server for a total of 9 open requests.",
                "default": 1,
                "required": true
            },
            "escapeAlgorithm": {
                "type": "string",
                "title": "Code Escaping Algorithm",
                "description": "Escaping algorithm used for the Custom Escaper Patterns. For Sugoi Translator, it is recommended to use Poleposition Placeholder, which replaces symbols with a hashtag followed by a short number. No particular reason, it just seems to break the least.",
                "default": RedPlaceholderType.poleposition,
                "required": false,
                "enum": RedPlaceholderTypeArray
            },
        }, [
            {
                "key": "targetUrl",
                "type": "textarea",
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    var urls = value.replaceAll("\r", "").split("\n");
                    var validUrls = [];
                    for (var i in urls) {
                        if (!this.isValidHttpUrl(urls[i]))
                            continue;
                        validUrls.push(urls[i]);
                    }
                    this.translatorEngine.update("targetUrl", validUrls.join("\n"));
                    $(evt.target).val(validUrls.join("\n"));
                }
            },
            {
                "type": "actions",
                "title": "Local Server Manager",
                "fieldHtmlClass": "actionButtonSet",
                "items": [
                    {
                        "type": "button",
                        "title": "Open server manager",
                        "onClick": function () {
                            try {
                                trans.sugoitrans.openServerManager();
                            }
                            catch (e) {
                                alert("This requires an up-to-date Sugoi Translator addon by Dreamsavior, it's just a shortcut. Sorry, little one.");
                            }
                        }
                    }
                ]
            },
            {
                "key": "maxParallelJob",
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    this.translatorEngine.update("maxParallelJob", parseInt(value));
                }
            },
            {
                "key": "threads",
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    this.translatorEngine.update("threads", parseInt(value));
                }
            },
        ]);
    }
}
class RedGoogleEngine extends RedTranslatorEngineWrapper {
    constructor(thisAddon) {
        super(thisAddon, {
            id: "redgoogles",
            name: "Red Google Translator",
            languages: {
                "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic", "hy": "Armenian", "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian", "bn": "Bengali", "bs": "Bosnian", "bg": "Bulgarian", "ca": "Catalan", "ceb": "Cebuano", "zh-CN": "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)", "co": "Corsican", "hr": "Croatian", "cs": "Czech", "da": "Danish", "nl": "Dutch", "en": "English", "eo": "Esperanto", "et": "Estonian", "fi": "Finnish", "fr": "French", "fy": "Frisian", "gl": "Galician", "ka": "Georgian", "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole", "ha": "Hausa", "haw": "Hawaiian", "he": "Hebrew", "hi": "Hindi", "hmn": "Hmong", "hu": "Hungarian", "is": "Icelandic", "ig": "Igbo", "id": "Indonesian", "ga": "Irish", "it": "Italian", "ja": "Japanese", "jw": "Javanese", "kn": "Kannada", "kk": "Kazakh", "km": "Khmer", "ko": "Korean", "ku": "Kurdish", "ky": "Kyrgyz", "lo": "Lao", "la": "Latin", "lv": "Latvian", "lt": "Lithuanian", "lb": "Luxembourgish", "mk": "Macedonian", "mg": "Malagasy", "ms": "Malay", "ml": "Malayalam", "mt": "Maltese", "mi": "Maori", "mr": "Marathi", "mn": "Mongolian", "my": "Myanmar (Burmese)", "ne": "Nepali", "no": "Norwegian", "ny": "Nyanja (Chichewa)", "ps": "Pashto", "fa": "Persian", "pl": "Polish", "pt": "Portuguese (Portugal, Brazil)", "pa": "Punjabi", "ro": "Romanian", "ru": "Russian", "sm": "Samoan", "gd": "Scots Gaelic", "sr": "Serbian", "st": "Sesotho", "sn": "Shona", "sd": "Sindhi", "si": "Sinhala (Sinhalese)", "sk": "Slovak", "sl": "Slovenian", "so": "Somali", "es": "Spanish", "su": "Sundanese", "sw": "Swahili", "sv": "Swedish", "tl": "Tagalog (Filipino)", "tg": "Tajik", "ta": "Tamil", "te": "Telugu", "th": "Thai", "tr": "Turkish", "uk": "Ukrainian", "ur": "Urdu", "uz": "Uzbek", "vi": "Vietnamese", "cy": "Welsh", "xh": "Xhosa", "yi": "Yiddish", "yo": "Yoruba", "zu": "Zulu"
            },
            targetUrl: "https://translate.google.com/translate_a/single",
            description: "A Google Translator using the same Text Processor as Red Sugoi Translator",
            batchDelay: 1,
            innerDelay: 5000,
            maximumBatchSize: 2000,
            skipReferencePair: true,
            lineDelimiter: "<br>",
            mode: "rowByRow",
        }, {
            "escapeAlgorithm": {
                "type": "string",
                "title": "Code Escaping Algorithm",
                "description": "Escaping algorithm used for the Custom Escaper Patterns. For Google, it is recommended to use Tag placeholder, as Google tries to not break tags.",
                "default": RedPlaceholderType.tagPlaceholder,
                "required": false,
                "enum": RedPlaceholderTypeArray
            },
        }, []);
        this.lastRequest = 0;
        this.delayed = [];
    }
    doTranslate(toTranslate, options) {
        let batchStartTime = new Date().getTime();
        let sourceLanguage = trans.getSl();
        let destinationLanguage = trans.getTl();
        let translating = 0;
        let translations = new Array(toTranslate.length);
        let maxBatchSize = this.getEngine().maximumBatchSize;
        let delay = this.getEngine().innerDelay;
        let rowSeparator = "<newrowmarker>";
        let progressCurrent = document.createTextNode("0");
        let progressTotal = document.createTextNode("/" + toTranslate.length);
        let currentAction = document.createTextNode("Starting up...");
        this.print(document.createTextNode("[Red Google] Translating current batch: "), progressCurrent, progressTotal, document.createTextNode(" - "), currentAction);
        let batchStart = 0;
        let translate = (onSuccess, onError) => {
            if (translating >= toTranslate.length) {
                currentAction.nodeValue = "Done!";
                let batchEnd = new Date().getTime();
                let seconds = Math.round((batchEnd - batchStartTime) / 100) / 10;
                this.log(`[RedGoogle] Batch took: ${seconds} seconds, which was about ${Math.round(10 * toTranslate.join("").length / seconds) / 10} characters per second!`);
                this.log(`[RedGoogle] We skipped ${this.getCacheHits()} translations through cache hits!`);
                return onSuccess(translations);
            }
            currentAction.nodeValue = "Gathering strings...";
            let batch = [];
            let batchSize = 0;
            batchStart = translating;
            let calcBatchSize = (addition) => {
                return addition.length + batchSize + (rowSeparator.length * batch.length);
            };
            while (translating < toTranslate.length && (batchSize == 0 || maxBatchSize > calcBatchSize(toTranslate[translating]))) {
                batch.push(toTranslate[translating]);
                batchSize += toTranslate[translating++].length;
            }
            let action = () => {
                sendToGoogle(batch, onSuccess, onError);
            };
            currentAction.nodeValue = "Waiting inner delay...";
            this.delay(action);
        };
        let sendToGoogle = (batch, onSuccess, onError) => {
            currentAction.nodeValue = "Sending to Google...";
            console.log("[RedGoogle] Batch: ", batch);
            common.fetch(this.getEngine().targetUrl, {
                method: 'get',
                data: ({
                    client: "gtx",
                    sl: sourceLanguage,
                    tl: destinationLanguage,
                    dt: 't',
                    q: batch.join(rowSeparator)
                }),
            }).then((data) => {
                currentAction.nodeValue = "Reading response...";
                let googleTranslations = data[0];
                let uglyTranslations = [];
                for (let i = 0; i < googleTranslations.length; i++) {
                    uglyTranslations.push(googleTranslations[i][0]);
                }
                let cleanTranslations = uglyTranslations.join("\n");
                cleanTranslations = cleanTranslations.replaceAll(/ *< */g, "<");
                cleanTranslations = cleanTranslations.replaceAll(/ *> */g, ">");
                cleanTranslations = cleanTranslations.replaceAll(/[\n]{2,}/g, "\n");
                cleanTranslations = cleanTranslations.replaceAll(/ *\n/g, "\n");
                cleanTranslations = cleanTranslations.replaceAll(new RegExp(rowSeparator, "gi"), rowSeparator);
                cleanTranslations = cleanTranslations.replaceAll("\n" + rowSeparator, rowSeparator);
                cleanTranslations = cleanTranslations.replaceAll(rowSeparator + "\n", rowSeparator);
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
                }
                else {
                    for (let i = 0; i < pristineTranslations.length; i++) {
                        translations[batchStart + i] = pristineTranslations[i].trim();
                        this.setCache(toTranslate[batchStart + i], pristineTranslations[i]);
                    }
                }
                progressCurrent.nodeValue = (parseInt(progressCurrent.nodeValue) + pristineTranslations.length).toString();
            }).catch(e => {
                currentAction.nodeValue = "DOH!";
                this.error("[Red Google] Error on fetch: " + e.message + ". Skipping batch.");
            }).finally(() => {
                translate(onSuccess, onError);
            });
        };
        return new Promise((onSuccess, onError) => {
            translate(onSuccess, onError);
        });
    }
    delay(callback) {
        let now = (new Date()).getTime();
        let engineDelay = this.getEngine().innerDelay;
        let timeDelta = now - this.lastRequest;
        if (timeDelta >= engineDelay) {
            this.lastRequest = now;
            callback();
        }
        else {
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
    abort() {
        this.allowTranslation = false;
        this.waiting = [];
        this.paused = false;
        this.delayed = [];
    }
}
var thisAddon = this;
let wrappers = [
    new RedSugoiEngine(thisAddon),
    new RedGoogleEngine(thisAddon),
];
wrappers.forEach(wrapper => {
    trans[wrapper.getEngine().id] = wrapper.getEngine();
});
$(document).ready(() => {
    wrappers.forEach(wrapper => {
        wrapper.getEngine().init();
    });
});
class RedStringRowHandler {
    constructor(row, wrapper) {
        this.curatedLines = [];
        this.translatableLines = [];
        this.translatableLinesIndex = [];
        this.translatedLines = [];
        this.originalRow = row;
        this.curatedLines = wrapper.curateRow(row);
        for (let i = 0; i < this.curatedLines.length; i++) {
            let curated = this.curatedLines[i];
            let line = curated.getReplacedText();
            if (line.trim() != "") {
                if (wrapper.hasCache(line)) {
                    curated.setTranslatedText(wrapper.getCache(line));
                }
                else {
                    this.translatableLines.push(line);
                    this.translatableLinesIndex.push(i);
                }
            }
        }
        this.translatedLines = new Array(this.translatableLines.length);
    }
    getOriginalRow() {
        return this.originalRow;
    }
    getTranslatedRow() {
        let lines = [];
        for (let i = 0; i < this.curatedLines.length; i++) {
            lines.push(this.curatedLines[i].recoverSymbols());
        }
        return lines.join("\n");
    }
    getTranslatableLines() {
        return [...this.translatableLines];
    }
    insertTranslation(text, index) {
        this.translatedLines[index] = text;
    }
    applyTranslation() {
        for (let i = 0; i < this.translatedLines.length; i++) {
            let translation = this.translatedLines[i];
            if (translation != undefined) {
                this.curatedLines[this.translatableLinesIndex[i]].setTranslatedText(translation);
            }
            else {
                this.curatedLines[this.translatableLinesIndex[i]].break();
            }
        }
    }
    isDone(index) {
        return index >= this.translatableLines.length;
    }
}
