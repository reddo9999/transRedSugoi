"use strict";
var RedPlaceholderType;
(function (RedPlaceholderType) {
    RedPlaceholderType["poleposition"] = "poleposition";
    RedPlaceholderType["hexPlaceholder"] = "hexPlaceholder";
    RedPlaceholderType["noEscape"] = "noEscape";
    RedPlaceholderType["ninesOfRandomness"] = "closedNines";
})(RedPlaceholderType || (RedPlaceholderType = {}));
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
                else if ((idx + tag.length) == text.length) {
                    this.postString = this.storedSymbols[tag] + this.postString;
                    text = text.substring(0, text.length - tag.length);
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
        this.allowTranslation = true;
        let escapingTitleMap = {};
        escapingTitleMap[RedPlaceholderType.hexPlaceholder] = "Hex Placeholder";
        escapingTitleMap[RedPlaceholderType.noEscape] = "No Escaping";
        escapingTitleMap[RedPlaceholderType.poleposition] = "Pole Position";
        escapingTitleMap[RedPlaceholderType.ninesOfRandomness] = "Closed Nines";
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
                        "description": "Sugoi Translator target URL.",
                        "default": "http://localhost:14366/",
                        "required": true
                    },
                    "maxParallelJob": {
                        "type": "number",
                        "title": "Max Parallel job",
                        "description": "Amount of requests done simultaneously. Due to the small latency between calls, you'll usually want 3 or 5 requests per server. You won't gain any actual speed if your resource usage is already at 100%, might even make it slower, so try to find a number that results in no waste, but also results in no overworking.",
                        "default": 5,
                        "required": true
                    },
                    "escapeAlgorithm": {
                        "type": "string",
                        "title": "Code Escaping Algorithm",
                        "description": "Escaping algorithm for inline code inside dialogues. Sugoi Translator is unpredictable. Hex Placeholder seems to work, but is interpreted weirdly. Pole Position Placeholder seems to be kept as-is more frequently and doesn't make a mess as often.",
                        "default": RedPlaceholderType.poleposition,
                        "required": false,
                        "enum": [
                            RedPlaceholderType.poleposition,
                            RedPlaceholderType.hexPlaceholder,
                            RedPlaceholderType.noEscape,
                            RedPlaceholderType.ninesOfRandomness
                        ]
                    },
                    "splitEnds": {
                        "type": "boolean",
                        "title": "Split Ends",
                        "description": "For added compatibility, symbols that begin or end sentences will not be sent to the translator. This deprives the translator from contextual information, but guarantees the symbol will not be lost nor misplaced.",
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
                                if (!isValidHttpUrl(urls[i]))
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
                    }
                ]
            }
        });
        this.translatorEngine.translate = (text, options) => {
            this.translate(text, options);
        };
        this.translatorEngine.abort = () => {
            this.abort();
        };
    }
    getEngine() {
        return this.translatorEngine;
    }
    abort() {
        this.allowTranslation = false;
    }
    getUrl() {
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
    freeUrl(url) {
        this.urlUsage[this.urls.indexOf(url)]--;
    }
    translate(text, options) {
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
        ui.showBusyOverlay();
        let complete = () => {
            finished++;
            if (finished == threads) {
                ui.hideBusyOverlay();
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
                        let split = line.split(/((?:\r?\n)+[｛（［【「『〝⟨「]+)/);
                        for (let k = 1; k < split.length - 1; k++) {
                            split[k] += split[k + 1];
                            split.splice(k + 1, 1);
                        }
                        lines.splice(i, 1, ...split);
                    }
                    let sugoiArray = [];
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i].trim();
                        if (line == "")
                            continue;
                        let tags = new RedStringEscaper(line, escapingType, splitEnds, true);
                        curated.push(tags);
                        sugoiArray.push(tags.getReplacedText());
                    }
                    fetch(myUrl, {
                        method: 'post',
                        body: JSON.stringify({ content: sugoiArray, message: "translate sentences" }),
                        headers: { 'Content-Type': 'application/json' },
                    })
                        .then(async (response) => {
                        let result = await response.json();
                        let finalTranslation = [];
                        for (let i = 0; i < curated.length; i++) {
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
                        doTranslate();
                    });
                }
            }
            catch (e) {
                console.error("[REDSUGOI] ERROR ON THREAD EXECUTION, SKIPPING", e);
                complete();
            }
        };
        for (let i = 0; i < threads; i++) {
            doTranslate();
        }
    }
}
var thisAddon = this;
var packageName = thisAddon.package.name;
function isValidHttpUrl(urlString) {
    let url;
    try {
        url = new URL(urlString);
    }
    catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}
var thisEngine = new RedTranslatorEngineWrapper(thisAddon);
window.trans[packageName] = thisEngine.getEngine();
$(document).ready(function () {
    thisEngine.getEngine().init();
});
