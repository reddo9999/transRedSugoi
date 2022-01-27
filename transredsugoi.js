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
    RedPlaceholderTypeNames["poleposition"] = "Poleposition";
    RedPlaceholderTypeNames["hexPlaceholder"] = "Hex Placeholder";
    RedPlaceholderTypeNames["noEscape"] = "No escaping";
    RedPlaceholderTypeNames["ninesOfRandomness"] = "Closed Nines";
    RedPlaceholderTypeNames["tagPlaceholder"] = "Tag Placeholder";
    RedPlaceholderTypeNames["closedTagPlaceholder"] = "Tag Placeholder (Closed Tags)";
    RedPlaceholderTypeNames["fullTagPlaceholder"] = "Tag Placeholder (Full XML-style Tag)";
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
    constructor(text, type, splitEnds, noUnks) {
        this.type = RedPlaceholderType.poleposition;
        this.splitEnds = true;
        this.removeUnks = true;
        this.symbolAffix = 1;
        this.currentSymbol = 4;
        this.hexCounter = 983041;
        this.closedNinesLength = 7;
        this.storedSymbols = {};
        this.reverseSymbols = {};
        this.preString = "";
        this.postString = "";
        this.text = text;
        this.currentText = text;
        this.type = type || RedPlaceholderType.poleposition;
        this.splitEnds = splitEnds == true;
        this.removeUnks = noUnks == true;
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
            console.warn("Recover loop");
            found = false;
            for (let key in this.storedSymbols) {
                let newText = this.currentText.replaceAll(key, this.storedSymbols[key]);
                if (newText != this.currentText) {
                    this.currentText = newText;
                    found = true;
                }
            }
        }
        let finalString = this.preString + this.currentText + this.postString;
        if (this.removeUnks) {
            finalString = finalString.replaceAll("<unk>", "");
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
        console.log("Formulas : ", formulas);
        for (var i = 0; i < formulas.length; i++) {
            if (!Boolean(formulas[i]))
                continue;
            if (typeof formulas[i] == 'function') {
                console.log(`formula ${i} is a function`);
                var arrayStrings = formulas[i].call(this, text);
                console.log(`result`, arrayStrings);
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
                console.log("replacing....");
                text = text.replaceAll(formulas[i], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }
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
            console.log(`handling ${i}`, sys.config.escaperPatterns[i]);
            if (typeof sys.config.escaperPatterns[i] !== "object")
                continue;
            if (!sys.config.escaperPatterns[i].value)
                continue;
            var newReg = "";
            try {
                console.log(sys.config.escaperPatterns[i].value);
                if (common.isRegExp(sys.config.escaperPatterns[i].value)) {
                    console.log("is regex");
                    newReg = common.evalRegExpStr(sys.config.escaperPatterns[i].value);
                }
                else if (common.isStringFunction(sys.config.escaperPatterns[i].value)) {
                    console.log("pattern ", i, "is function");
                    newReg = RedStringEscaper.renderFunction(sys.config.escaperPatterns[i].value);
                }
                else {
                    console.log("Is string");
                    newReg = JSON.parse(sys.config.escaperPatterns[i].value);
                }
            }
            catch (e) {
                console.warn("[TAG PLACEHOLDER] Error Trying to render ", sys.config.escaperPatterns[i], e);
            }
            if (newReg)
                formulas.push(newReg);
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
    constructor(thisAddon) {
        this.urls = [];
        this.urlUsage = [];
        this.urlScore = [];
        this.allowTranslation = true;
        this.paused = false;
        this.waiting = [];
        this.translationCache = {};
        let escapingTitleMap = RedPlaceholderTypeNames;
        this.translatorEngine = new TranslatorEngine({
            id: thisAddon.package.name,
            name: thisAddon.package.title,
            author: thisAddon.package.author.name,
            version: thisAddon.package.version,
            description: thisAddon.package.description,
            batchDelay: 1,
            skipReferencePair: true,
            lineDelimiter: "<br>",
            mode: "rowByRow",
            targetUrl: "http://localhost:14366/",
            languages: {
                "en": "English",
                "ja": "Japanese"
            },
            optionsForm: {
                "schema": {
                    "targetUrl": {
                        "type": "string",
                        "title": "Target URL(s)",
                        "description": "Sugoi Translator target URL. If you have multiple servers, you can put one in each line.",
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
                        "description": "To improve speed, every translation sent to Sugoi Translator will be stored in case the same sentence appears again. Depending on the game, this can range from 0% gains to over 50%. There are no downsides, but in case you want to test the translator itself this is left as an option. Recommended is ON.",
                        "default": true
                    },
                    "detectStrings": {
                        "type": "boolean",
                        "title": "Literal String Detection",
                        "description": "Attempts to detect literal strings and safeguards them so that they don't stop being strings after translation. Heavily recommended to be ON, particularly if translating scripts.",
                        "default": true
                    },
                },
                "form": [
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
                        "key": "maxParallelJob",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("maxParallelJob", parseInt(value));
                        }
                    },
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
    isCaching() {
        let useCache = this.getEngine().getOptions().useCache;
        return useCache == undefined ? true : useCache == true;
    }
    isKeepingScripts() {
        let detectStrings = this.getEngine().getOptions().detectStrings;
        return detectStrings == undefined ? true : detectStrings == true;
    }
    translate(text, options) {
        this.resetScores();
        let cacheHits = 0;
        let batchStart = new Date().getTime();
        this.resume(true);
        console.log("[REDSUGOI] TRANSLATE:\n", text, options);
        this.allowTranslation = true;
        options = options || {};
        options.onAfterLoading = options.onAfterLoading || function () { };
        options.onError = options.onError || function () { };
        options.always = options.always || function () { };
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
        if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
            ui.showBusyOverlay();
        }
        else {
            consoleWindow.appendChild(pre);
        }
        let complete = () => {
            finished++;
            if (finished == threads) {
                if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
                    ui.hideBusyOverlay();
                }
                else {
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
                }
                if (typeof options.onAfterLoading == 'function') {
                    result.translationText = translations.join();
                    result.translation = translations;
                    options.onAfterLoading.call(this.translatorEngine, result);
                }
            }
        };
        let escapingType = this.getEngine().getOptions().escapeAlgorithm || RedPlaceholderType.poleposition;
        let splitEnds = this.getEngine().getOptions().splitEnds;
        splitEnds = splitEnds == undefined ? true : splitEnds === true;
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
                }
                else {
                    let myUrl = this.getUrl();
                    let curated = [];
                    let lines = text[mine].split(/( *\r?\n(?:\r?\n)+ *)/);
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
                    let isScript = false;
                    let quoteType = "";
                    if (this.isKeepingScripts() &&
                        lines.length == 1 &&
                        ["'", '"'].indexOf(lines[0].trim().charAt(0)) != -1 &&
                        lines[0].charAt(lines[0].trim().length - 1) == lines[0].trim().charAt(0)) {
                        try {
                            let innerString = JSON.parse(lines[0]);
                            isScript = true;
                            quoteType = lines[0].trim().charAt(0);
                            lines[0] = innerString;
                        }
                        catch (e) {
                            console.warn("[REDSUGOI] I thought it was a script but it wasn't. Do check.", lines[0], e);
                        }
                    }
                    let sugoiArray = [];
                    let sugoiArrayTracker = {};
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i].trim();
                        let tags = new RedStringEscaper(line, escapingType, splitEnds, true);
                        let myIndex = curated.push(tags) - 1;
                        let escapedText = tags.getReplacedText();
                        if (escapedText.trim() != "" && this.translationCache[escapedText] == undefined) {
                            sugoiArrayTracker[myIndex] = sugoiArray.push(escapedText) - 1;
                        }
                    }
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
                                    curated[i].setTranslatedText(result[translatedIndex]);
                                }
                                else if (this.translationCache[curated[i].getReplacedText()] != undefined) {
                                    cacheHits++;
                                    curated[i].setTranslatedText(this.translationCache[curated[i].getReplacedText()]);
                                }
                                finalTranslation.push(curated[i].recoverSymbols());
                            }
                            let finalTranslationString = finalTranslation.join("\n");
                            if (isScript) {
                                finalTranslationString = JSON.stringify(finalTranslation);
                                if (finalTranslationString.charAt(0) != quoteType) {
                                    finalTranslationString = finalTranslationString.replaceAll(quoteType, `\\${quoteType}`);
                                    finalTranslationString = quoteType + finalTranslationString.substring(1, finalTranslationString.length - 1) + quoteType;
                                }
                            }
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
                            doTranslate();
                        });
                    }
                    else {
                        let finalTranslation = [];
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
            }
            catch (error) {
                console.error("[REDSUGOI] ERROR ON THREAD EXECUTION, SKIPPING", error);
                let pre = document.createElement("pre");
                pre.style.color = "red";
                pre.style.fontWeight = "bold";
                pre.appendChild(document.createTextNode("[REDSUGOI] ERROR ON THREAD - " + error.name + ': ' + error.message));
                consoleWindow.appendChild(pre);
                complete();
            }
        };
        for (let i = 0; i < threads; i++) {
            doTranslate();
        }
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
var thisAddon = this;
var packageName = thisAddon.package.name;
var thisEngine = new RedTranslatorEngineWrapper(thisAddon);
window.trans[packageName] = thisEngine.getEngine();
$(document).ready(function () {
    thisEngine.getEngine().init();
});
