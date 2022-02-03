"use strict";
var RedPlaceholderType;
(function (RedPlaceholderType) {
    RedPlaceholderType["poleposition"] = "poleposition";
    RedPlaceholderType["hexPlaceholder"] = "hexPlaceholder";
    RedPlaceholderType["noEscape"] = "noEscape";
    RedPlaceholderType["ninesOfRandomness"] = "closedNines";
    RedPlaceholderType["tagPlaceholder"] = "tagPlaceholder";
    RedPlaceholderType["closedTagPlaceholder"] = "closedTagPlaceholder";
    RedPlaceholderType["fullTagPlaceholder"] = "fullTagPlaceholder";
})(RedPlaceholderType || (RedPlaceholderType = {}));
var RedPlaceholderTypeNames;
(function (RedPlaceholderTypeNames) {
    RedPlaceholderTypeNames["poleposition"] = "Poleposition (e.g. #24)";
    RedPlaceholderTypeNames["hexPlaceholder"] = "Hex Placeholder (e.g. 0xffffff)";
    RedPlaceholderTypeNames["noEscape"] = "No escaping (will translate everything)";
    RedPlaceholderTypeNames["ninesOfRandomness"] = "Closed Nines (e.g. 9123412349)";
    RedPlaceholderTypeNames["tagPlaceholder"] = "Tag Placeholder (e.g. <24>)";
    RedPlaceholderTypeNames["closedTagPlaceholder"] = "Tag Placeholder Closed Tags (e.g. <24/>)";
    RedPlaceholderTypeNames["fullTagPlaceholder"] = "Tag Placeholder Full XML-style Tag (e.g. <24></24>)";
})(RedPlaceholderTypeNames || (RedPlaceholderTypeNames = {}));
let RedPlaceholderTypeArray = [
    RedPlaceholderType.poleposition,
    RedPlaceholderType.hexPlaceholder,
    RedPlaceholderType.noEscape,
    RedPlaceholderType.ninesOfRandomness,
    RedPlaceholderType.tagPlaceholder,
    RedPlaceholderType.closedTagPlaceholder,
    RedPlaceholderType.fullTagPlaceholder,
];
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
        return this.currentText;
    }
    setTranslatedText(text) {
        this.currentText = text;
    }
    recoverSymbols() {
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
        let finalString = this.preString + this.currentText + this.postString;
        if (this.removeUnks) {
            finalString = finalString.replaceAll("<unk>", "");
        }
        if (this.isScript) {
            finalString = JSON.stringify(finalString);
            if (finalString.charAt(0) != this.quoteType) {
                finalString = finalString.replaceAll(this.quoteType, `\\${this.quoteType}`);
                finalString = this.quoteType + finalString.substring(1, finalString.length - 1) + this.quoteType;
            }
        }
        return finalString;
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
            regExpObj[RedPlaceholderType.closedTagPlaceholder] = /(<[0-9]{2,}\/>)/g;
            regExpObj[RedPlaceholderType.ninesOfRandomness] = new RegExp("((?:9[0-9]{" + this.closedNinesLength + ",}9){2,})", "g");
            regExpObj[RedPlaceholderType.fullTagPlaceholder] = /((?:<[0-9]{2,}><\/[0-9]{2,}>){2,})/g;
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
        let escapingTitleMap = RedPlaceholderTypeNames;
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
                    "escapeAlgorithm": {
                        "type": "string",
                        "title": "Code Escaping Algorithm",
                        "description": "Escaping algorithm used for the Custom Escaper Patterns. For Sugoi Translator, it is recommended to use Poleposition Placeholder, which replaces symbols with a hashtag followed by a short number. All options are available, should a particular project require them.",
                        "default": RedPlaceholderType.poleposition,
                        "required": false,
                        "enum": RedPlaceholderTypeArray
                    },
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
            let split = line.split(/([｝）］】」』〟⟩！？。・…‥：]+ *\r?\n)/);
            for (let k = 0; k < split.length - 1; k++) {
                split[k] += split[k + 1];
                split.splice(k + 1, 1);
            }
            lines.splice(i, 1, ...split);
        }
        for (let i = lines.length - 1; i >= 0; i--) {
            let line = lines[i];
            let split = line.split(/((?:\r?\n)+ *[｛（［【「『〝⟨「]+)/);
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
    translate(text, options) {
        options = options || {};
        options.onAfterLoading = options.onAfterLoading || function () { };
        options.onError = options.onError || function () { };
        options.always = options.always || function () { };
        if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
            ui.showBusyOverlay();
        }
        let translation = this.doTranslate(text, options);
        translation.then((result) => {
            options.onAfterLoading.call(this.translatorEngine, result);
        }).catch((reason) => {
            console.error("[RedTranslatorEngine] Well shit.", reason);
        }).finally(() => {
            if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
                ui.hideBusyOverlay();
            }
        });
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
    updateUrls() {
        let thisEngine = this.translatorEngine;
        let urls = thisEngine.targetUrl.replaceAll("\r", "").split("\n");
        if (this.urls.length != urls.length) {
            this.urls = [...urls];
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
    doTranslate(rows, options) {
        this.resetScores();
        this.resume(true);
        this.allowTranslation = true;
        console.log("[REDSUGOI] TRANSLATE:\n", rows, options);
        let batchStart = new Date().getTime();
        let result = {
            'sourceText': rows.join(),
            'translationText': "",
            'source': rows,
            'translation': []
        };
        let rowHandlers = [];
        let toTranslate = [];
        let translations = [];
        let translating = 0;
        for (let i = 0; i < rows.length; i++) {
            let handler = new RedStringRowHandler(rows[i], this);
            rowHandlers.push(handler);
            toTranslate.push(...handler.getTranslatableLines());
        }
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
            progressNode.nodeValue = (translatedLines).toString();
            progressTotal.nodeValue = "/" + toTranslate.length.toString();
        };
        let maximumPayload = this.getEngine().getOptions().maxParallelJob || 5;
        let threads = this.getEngine().getOptions().threads || 1;
        let completedThreads = 0;
        let totalThreads = this.getUrlCount() * threads;
        let complete;
        let doTranslate = (onSuccess, onError) => {
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
        };
        complete = (onSuccess, onError) => {
            if (++completedThreads == totalThreads) {
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
                onSuccess(result);
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
                pre.appendChild(document.createTextNode(`\n[RedSugoi] Batch took: ${seconds} seconds, which was about ${Math.round(10 * rows.length / seconds) / 10} rows per second!`));
                pre.appendChild(document.createTextNode(`\n[RedSugoi] We skipped ${this.getCacheHits()} translations through cache hits!`));
                consoleWindow.appendChild(pre);
            }
        };
        window.rowHandlers = rowHandlers;
        return new Promise((onSuccess, onError) => {
            for (let i = 0; i < totalThreads; i++) {
                doTranslate(onSuccess, onError);
            }
        });
    }
    doTranslateOld(text, options) {
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
        let threads = this.getEngine().getOptions().maxParallelJob || 1;
        let pick = 0;
        let finished = 0;
        let translations = new Array(text.length);
        let result = {
            'sourceText': text.join(),
            'translationText': "",
            'source': text,
            'translation': []
        };
        let translatedLines = 0;
        let updateProgress = () => {
            progressNode.nodeValue = (++translatedLines).toString();
        };
        let complete = (onSuccess, onError) => {
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
                let seconds = Math.round((batchEnd - batchStart) / 100) / 10;
                pre.appendChild(document.createTextNode(`\n[RedSugoi] Batch took: ${seconds} seconds, which was about ${Math.round(10 * text.length / seconds) / 10} rows per second!`));
                pre.appendChild(document.createTextNode(`\n[RedSugoi] We skipped ${cacheHits} translations through cache hits!`));
                consoleWindow.appendChild(pre);
                result.translationText = translations.join();
                result.translation = translations;
                onSuccess(result);
            }
        };
        let doTranslate = async (onSuccess, onError) => {
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
                }
                else {
                    let sugoiArray = [];
                    let sugoiArrayTracker = {};
                    let curated = this.curateRow(text[mine]);
                    for (let i = 0; i < curated.length; i++) {
                        let escapedText = curated[i].getReplacedText();
                        if (escapedText.trim() != "" && this.translationCache[escapedText] == undefined) {
                            sugoiArrayTracker[i] = sugoiArray.push(escapedText) - 1;
                        }
                    }
                    let myUrl = this.getUrl();
                    if (sugoiArray.length > 0) {
                        fetch(myUrl, {
                            method: 'post',
                            body: JSON.stringify({ content: sugoiArray, message: "translate sentences" }),
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then(async (response) => {
                            let result = await response.json();
                            let finalTranslation = [];
                            for (let i = 0; i < curated.length; i++) {
                                let translatedIndex = sugoiArrayTracker[i];
                                if (result[translatedIndex] != undefined) {
                                    if (this.isCaching()) {
                                        this.translationCache[curated[i].getReplacedText()] = result[translatedIndex];
                                    }
                                    console.log("[RedSugoi] Translated a thing!", {
                                        originalText: curated[i].getOriginalText(),
                                        translatedText: result[translatedIndex]
                                    });
                                    curated[i].setTranslatedText(result[translatedIndex]);
                                }
                                else if (this.translationCache[curated[i].getReplacedText()] != undefined) {
                                    console.log("[RedSugoi] Got a cache hit!", {
                                        originalText: curated[i].getOriginalText(),
                                        translatedText: this.translationCache[curated[i].getReplacedText()]
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
                    }
                    else {
                        let finalTranslation = [];
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
            }
            catch (error) {
                console.error("[REDSUGOI] ERROR ON THREAD EXECUTION, SKIPPING", error);
                let pre = document.createElement("pre");
                pre.style.color = "red";
                pre.style.fontWeight = "bold";
                pre.appendChild(document.createTextNode("[REDSUGOI] ERROR ON THREAD - " + error.name + ': ' + error.message));
                consoleWindow.appendChild(pre);
                complete(onSuccess, onError);
            }
        };
        return new Promise((onSuccess, onError) => {
            for (let i = 0; i < threads; i++) {
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
                "description": "The amount of translations that are sent to the server per request. Sweet spot will vary with hardware.",
                "default": 5,
                "required": true
            },
            "threads": {
                "type": "number",
                "title": "Threads",
                "description": "The amount of requests that are sent per server.",
                "default": 1,
                "required": true
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
var thisAddon = this;
let wrappers = [new RedSugoiEngine(thisAddon)];
wrappers.forEach(wrapper => {
    trans[wrapper.getEngine().id] = wrapper.getEngine();
});
$(document).ready(() => {
    wrappers.forEach(wrapper => {
        wrapper.getEngine().init();
    });
});
class RedDeepLEngine extends RedTranslatorEngineWrapper {
    constructor(thisAddon) {
        super(thisAddon, {
            id: "reddeepl",
            name: "Red DeepL Translator",
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
                "description": "The amount of requests which will be sent simultaneously. Due to the small latency between sending a request and receiving a response, you'll usually want at least 5 requests per server so that you don't leave resources idling. Bigger numbers are also fine, but there are diminishing returns and you will lose Cache benefits if the number is too large. Recommended values are 5 to 10 per server (so if you have two servers, ideal number would be between 10 and 20). Remember, the goal is to not have anything idle, but you also don't want to overwhelm your servers to the point they start underperforming.",
                "default": 5,
                "required": true
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
        ]);
    }
    getUrl() {
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
    freeUrl(url) {
        this.urlUsage[this.urls.indexOf(url)]--;
    }
    resetScores() {
        this.urlScore = new Array(this.urls.length).fill(0);
    }
    doTranslate(text, options) {
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
        let threads = this.getEngine().getOptions().maxParallelJob || 1;
        let pick = 0;
        let finished = 0;
        let translations = new Array(text.length);
        let result = {
            'sourceText': text.join(),
            'translationText': "",
            'source': text,
            'translation': []
        };
        let translatedLines = 0;
        let updateProgress = () => {
            progressNode.nodeValue = (++translatedLines).toString();
        };
        let complete = (onSuccess, onError) => {
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
                let seconds = Math.round((batchEnd - batchStart) / 100) / 10;
                pre.appendChild(document.createTextNode(`\n[RedSugoi] Batch took: ${seconds} seconds, which was about ${Math.round(10 * text.length / seconds) / 10} rows per second!`));
                pre.appendChild(document.createTextNode(`\n[RedSugoi] We skipped ${cacheHits} translations through cache hits!`));
                consoleWindow.appendChild(pre);
                result.translationText = translations.join();
                result.translation = translations;
                onSuccess(result);
            }
        };
        let doTranslate = async (onSuccess, onError) => {
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
                }
                else {
                    let sugoiArray = [];
                    let sugoiArrayTracker = {};
                    let curated = this.curateRow(text[mine]);
                    for (let i = 0; i < curated.length; i++) {
                        let escapedText = curated[i].getReplacedText();
                        if (escapedText.trim() != "" && this.translationCache[escapedText] == undefined) {
                            sugoiArrayTracker[i] = sugoiArray.push(escapedText) - 1;
                        }
                    }
                    let myUrl = this.getUrl();
                    if (sugoiArray.length > 0) {
                        fetch(myUrl, {
                            method: 'post',
                            body: JSON.stringify({ content: sugoiArray, message: "translate sentences" }),
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then(async (response) => {
                            let result = await response.json();
                            let finalTranslation = [];
                            for (let i = 0; i < curated.length; i++) {
                                let translatedIndex = sugoiArrayTracker[i];
                                if (result[translatedIndex] != undefined) {
                                    if (this.isCaching()) {
                                        this.translationCache[curated[i].getReplacedText()] = result[translatedIndex];
                                    }
                                    console.log("[RedSugoi] Translated a thing!", {
                                        originalText: curated[i].getOriginalText(),
                                        translatedText: result[translatedIndex]
                                    });
                                    curated[i].setTranslatedText(result[translatedIndex]);
                                }
                                else if (this.translationCache[curated[i].getReplacedText()] != undefined) {
                                    console.log("[RedSugoi] Got a cache hit!", {
                                        originalText: curated[i].getOriginalText(),
                                        translatedText: this.translationCache[curated[i].getReplacedText()]
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
                    }
                    else {
                        let finalTranslation = [];
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
            }
            catch (error) {
                console.error("[REDSUGOI] ERROR ON THREAD EXECUTION, SKIPPING", error);
                let pre = document.createElement("pre");
                pre.style.color = "red";
                pre.style.fontWeight = "bold";
                pre.appendChild(document.createTextNode("[REDSUGOI] ERROR ON THREAD - " + error.name + ': ' + error.message));
                consoleWindow.appendChild(pre);
                complete(onSuccess, onError);
            }
        };
        return new Promise((onSuccess, onError) => {
            for (let i = 0; i < threads; i++) {
                doTranslate(onSuccess, onError);
            }
        });
    }
}
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
            this.curatedLines[this.translatableLinesIndex[i]].setTranslatedText(this.translatedLines[i]);
        }
    }
    isDone(index) {
        return index >= this.translatableLines.length;
    }
}
