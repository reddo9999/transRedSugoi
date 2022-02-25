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
    RedPlaceholderType["privateUse"] = "privateUse";
    RedPlaceholderType["hashtag"] = "hashtag";
    RedPlaceholderType["hashtagTriple"] = "hashtagTriple";
    RedPlaceholderType["tournament"] = "tournament";
    RedPlaceholderType["mvStyle"] = "mvStyle";
    RedPlaceholderType["wolfStyle"] = "wolfStyle";
    RedPlaceholderType["percentage"] = "percentage";
    RedPlaceholderType["mvStyleLetter"] = "mvStyleLetter";
})(RedPlaceholderType || (RedPlaceholderType = {}));
// I wonder if we could initiate this through calling the above...
// I'd rather not have to change both
var RedPlaceholderTypeNames;
// I wonder if we could initiate this through calling the above...
// I'd rather not have to change both
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
    RedPlaceholderTypeNames["privateUse"] = "Supplementary Private Use Area-A (\uD83D\uDC7D)";
    RedPlaceholderTypeNames["hashtag"] = "Hashtag (#A)";
    RedPlaceholderTypeNames["hashtagTriple"] = "Triple Hashtag (#ABC)";
    RedPlaceholderTypeNames["tournament"] = "Tournament (e.g. #1, #2, #3)";
    RedPlaceholderTypeNames["mvStyle"] = "MV Message (e.g. %1, %2, %3)";
    RedPlaceholderTypeNames["mvStyleLetter"] = "MV Message but with Letters (e.g. %A, %B, %C)";
    RedPlaceholderTypeNames["wolfStyle"] = "Wolf Message (e.g. @1, @2, @3)";
    RedPlaceholderTypeNames["percentage"] = "Actual Percentage (e.g. 1%, 2%)";
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
    RedPlaceholderType.privateUse,
    RedPlaceholderType.hashtag,
    RedPlaceholderType.hashtagTriple,
    RedPlaceholderType.tournament,
    RedPlaceholderType.mvStyle,
    RedPlaceholderType.mvStyleLetter,
    RedPlaceholderType.wolfStyle,
    RedPlaceholderType.percentage,
];
let regExpObj = {};
regExpObj[RedPlaceholderType.poleposition] = /((?: *　*#[0-9]+ *　*){2,})/g;
regExpObj[RedPlaceholderType.mvStyle] = /((?: *　*%[0-9]+ *　*){2,})/g;
regExpObj[RedPlaceholderType.percentage] = /((?: *　*[0-9]+% *　*){2,})/g;
regExpObj[RedPlaceholderType.wolfStyle] = /((?: *　*@[0-9]+ *　*){2,})/g;
regExpObj[RedPlaceholderType.tournament] = /((?: *　*#[0-9]+ *　*){2,})/g;
regExpObj[RedPlaceholderType.hexPlaceholder] = /((?: *　*0x[0-9a-fA-F]+ *　*){2,})/gi;
regExpObj[RedPlaceholderType.tagPlaceholder] = /((?: *　*<[0-9]{2,}> *　*){2,})/g;
regExpObj[RedPlaceholderType.closedTagPlaceholder] = /((?: *　*<[0-9]{2,}\/> *　*){2,})/g;
regExpObj[RedPlaceholderType.ninesOfRandomness] = new RegExp("((?: *　*9[0-9]{4,}9 *　*){2,})", "g");
regExpObj[RedPlaceholderType.fullTagPlaceholder] = /((?: *　*<[0-9]{2,}><\/[0-9]{2,}> *　*){2,})/g;
regExpObj[RedPlaceholderType.curlie] = /((?: *　*{[A-Z]+} *　*){2,})/g;
regExpObj[RedPlaceholderType.doubleCurlie] = /((?: *　*{{[A-Z]+} *　*){2,}})/gi;
regExpObj[RedPlaceholderType.privateUse] = /((?: *　*[\uF000-\uFFFF] *　*){2,}})/g;
regExpObj[RedPlaceholderType.hashtag] = /((?: *　*#[A-Z] *　*){2,})/gi;
regExpObj[RedPlaceholderType.hashtagTriple] = /((?: *　*#[A-Z][A-Z][A-Z] *　*){2,})/gi;
regExpObj[RedPlaceholderType.mvStyleLetter] = /((?: *　*%[A-Z] *　*){2,})/gi;
let escapingTitleMap = RedPlaceholderTypeNames;
class RedStringEscaper {
    constructor(text, options) {
        this.type = RedPlaceholderType.poleposition;
        this.splitEnds = true;
        this.removeUnks = true;
        this.mergeSymbols = true;
        this.symbolAffix = 1;
        this.currentSymbol = 4;
        this.hexCounter = 983041;
        this.closedNinesLength = 7; // plus two boundaries
        this.storedSymbols = {};
        this.reverseSymbols = {};
        this.broken = false;
        this.curlyCount = 65; //A
        this.privateCounter = 983041; // 👽
        this.preString = "";
        this.postString = "";
        this.hashtagOne = 65; //A
        this.hashtagTwo = 66; //B
        this.hashtagThree = 67; //C
        this.extractedStrings = [];
        this.extractedKeys = [];
        this.wasExtracted = false;
        this.text = text;
        this.currentText = text;
        this.type = options.type || RedPlaceholderType.poleposition;
        this.splitEnds = options.splitEnds == true;
        this.removeUnks = options.noUnks == true;
        this.mergeSymbols = options.mergeSymbols == true;
        this.wasExtracted = options.isExtracted == true;
        if (options.isolateSymbols == true) {
            options.isExtracted = true;
            this.currentText = this.currentText.replaceAll(new RegExp(options.isolateRegExp, "gim"), (match) => {
                let placeholder = this.storeSymbol(match);
                this.extractedKeys.push(placeholder);
                this.extractedStrings.push(new RedStringEscaper(match, options));
                return placeholder;
            });
        }
        this.escape();
    }
    isExtracted() {
        return this.wasExtracted;
    }
    getExtractedStrings() {
        return this.extractedStrings;
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
    getMvStyle() {
        return `%${this.symbolAffix++}`;
    }
    getMvStyleLetter() {
        return `%${String.fromCharCode(this.curlyCount++)}`;
    }
    getWolfStyle() {
        return `@${this.symbolAffix++}`;
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
    getPrivateArea() {
        return String.fromCodePoint(this.privateCounter++);
    }
    getHashtag() {
        return `#${String.fromCharCode(this.hashtagOne++)}`;
    }
    getTripleHashtag() {
        return `#${String.fromCharCode(this.hashtagOne++)}${String.fromCharCode(this.hashtagTwo++)}${String.fromCharCode(this.hashtagThree++)}`;
    }
    getTournament() {
        return `#${this.symbolAffix++}`;
    }
    getPercentage() {
        return `${this.symbolAffix++}%`;
    }
    storeSymbol(text) {
        // Originally was using tags, hence the name. Then I tried parenthesis.
        // I think the AI might get used to any tags we use and just start. ... killing them
        // So far this seems to work the best
        if (this.reverseSymbols[text] != undefined) {
            // if we reuse the same symbol it might help the AI understand the sentence
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
                case RedPlaceholderType.privateUse:
                    tag = this.getPrivateArea();
                    break;
                case RedPlaceholderType.hashtag:
                    tag = this.getHashtag();
                    break;
                case RedPlaceholderType.hashtagTriple:
                    tag = this.getTripleHashtag();
                    break;
                case RedPlaceholderType.tournament:
                    tag = this.getTournament();
                    break;
                case RedPlaceholderType.mvStyle:
                    tag = this.getMvStyle();
                    break;
                case RedPlaceholderType.mvStyleLetter:
                    tag = this.getMvStyleLetter();
                    break;
                case RedPlaceholderType.wolfStyle:
                    tag = this.getWolfStyle();
                    break;
                case RedPlaceholderType.percentage:
                    tag = this.getPercentage();
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
        // DEBUG
        //console.log(this.currentText, this.storedSymbols);
        // This needs to be done FIRST!!!!!!!!!!!!!!
        this.currentText = this.preString + this.currentText + this.postString;
        for (let i = 0; i < this.extractedStrings.length; i++) {
            this.storedSymbols[this.extractedKeys[i]] = this.extractedStrings[i].recoverSymbols();
        }
        // This is pretty fast to do, so we iterate until we're sure we got everything *just in case*
        // Worst case scenario this will be a single unnecessary run through anyway, and this allows us to possibly end up with nested symbols
        let found = true;
        while (found) {
            //console.warn("Recover loop");
            found = false;
            for (let key in this.storedSymbols) {
                if (this.storedSymbols[key] == key) {
                    // User has escaped the placeholder itself...
                    continue;
                }
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
        // Sugoi fails and adds <unk> where it doesn't understand something
        // It turns people into pigs! Pigs!
        // let's remove those
        if (this.removeUnks) {
            this.currentText = this.currentText.replaceAll("<unk>", "");
        }
        // DEBUG
        // console.log(finalString, this.storedSymbols);
        return this.currentText;
    }
    /**
     * Ideally we'd make something that works just the same as the hex placeholder, but I'm currently too drunk to analyze it
     * So I'll just make something that's hopefully similar enough to live through updates!
     */
    escape() {
        // Are we escaping?
        if (this.type == RedPlaceholderType.noEscape) {
            this.currentText = this.text;
            return this.text;
        }
        let formulas = RedStringEscaper.getActiveFormulas();
        let text = this.currentText || this.text;
        //console.log("Formulas : ", formulas);
        for (var i = 0; i < formulas.length; i++) {
            if (!Boolean(formulas[i]))
                continue;
            /**
             * Function should return a string or Array of strings
             */
            if (typeof formulas[i] == 'function') {
                //console.log(`formula ${i} is a function`);
                var arrayStrings = formulas[i].call(this, text);
                //console.log(`result`, arrayStrings);
                if (typeof arrayStrings == 'string')
                    arrayStrings = [arrayStrings];
                if (Array.isArray(arrayStrings) == false)
                    continue;
                for (var x in arrayStrings) {
                    text = text.replaceAll(arrayStrings[x], (match) => {
                        // Is this used for anything?
                        //var lastIndex = this.placeHolders.push(match)-1;
                        return this.storeSymbol(match);
                    });
                }
            }
            else {
                //console.log("replacing....");
                text = text.replaceAll(formulas[i], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }
        // Just for fun, if we have symbols at the very start or the very end, don't even send them to the translator!
        // We end up missing some contextual clues that may help 
        //      (e.g. "\c[2] is annoying" would at least give them the context of "[symbol] is annoying", which could improve translations)
        //      without context information it'd probably translate to an end result of "[symbol] It is annoying" since it had no subject.
        // Safety vs Quality?
        // Results are VERY good when the symbols aren't actually part of the sentence, which escaped symbols at start or end most likely are.
        // replaceAll won't give us the exact position of what it's replacing and I don't like guessing, so instead I'll check manually.
        this.currentText = this.currentText.trim();
        let found = true;
        let loops = 0;
        while (found && this.splitEnds) {
            found = false;
            for (let tag in this.storedSymbols) {
                let idx = text.indexOf(tag);
                if (idx == 0) {
                    this.preString += tag; // Instead of doing the work right away, let's leave this because we might have nested symbols.
                    text = text.substring(tag.length); // replace was dangerous, so we do it old school
                    found = true;
                }
                else if (idx != -1 && (idx + tag.length) == text.length) {
                    // Everything we find after the first one will be coming before it, not after
                    this.postString = this.storedSymbols[tag] + this.postString;
                    text = text.substring(0, idx);
                    found = true;
                }
            }
            // Honestly if it happens this much we can be safe in knowing something in the text caused a loop.
            if (loops++ > 30) {
                console.warn("[RedStringEscaper] Got stuck in a loop.", text, this);
                break;
            }
        }
        // Replace sequential occurrences of Symbols with a single symbol!
        // TESTING THIS IS HELL ON EARTH SOMEONE PLEASE TEST THIS I DON'T HAVE GOOD SENTENCES TO TEST IT
        // Theoretically, this should result in less mangling of symbols as the translator is fed less of them to begin with
        if (this.mergeSymbols) {
            if (regExpObj[this.type] != undefined) {
                text = text.replaceAll(regExpObj[this.type], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }
        this.currentText = text;
        //console.log("%cEscaped text", 'background: #222; color: #bada55');
        //console.log(text);
        return text;
    }
    static getActiveFormulas() {
        sys.config.escaperPatterns = sys.config.escaperPatterns || [];
        // Is our cache valid?
        if (RedStringEscaper.cachedFormulaString == JSON.stringify(sys.config.escaperPatterns)) {
            return RedStringEscaper.cachedFormulas;
        }
        // Update cache
        let formulas = [];
        for (var i in sys.config.escaperPatterns) {
            //console.log(`handling ${i}`, sys.config.escaperPatterns[i]);
            if (typeof sys.config.escaperPatterns[i] !== "object")
                continue;
            if (!sys.config.escaperPatterns[i].value)
                continue;
            try {
                var newReg;
                //console.log(sys.config.escaperPatterns[i].value);
                if (common.isRegExp(sys.config.escaperPatterns[i].value)) {
                    //console.log("is regex");
                    newReg = common.evalRegExpStr(sys.config.escaperPatterns[i].value);
                }
                else if (common.isStringFunction(sys.config.escaperPatterns[i].value)) {
                    //console.log("pattern ", i, "is function");
                    newReg = RedStringEscaper.renderFunction(sys.config.escaperPatterns[i].value);
                }
                else {
                    //console.log("Is string");
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
        // Since sugoi only translates japanese, might as well remove anything else
        //formulas.push(/(^[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf])/g);
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
class RedPersistentCacheHandler {
    constructor(id) {
        this.fs = require("fs");
        this.cache = {};
        this.changed = false;
        this.busy = false;
        this.transId = id;
    }
    addCache(key, translation) {
        this.cache[key] = translation;
        this.changed = true;
    }
    resetCache() {
        this.cache = {};
        this.changed = true;
    }
    hasCache(key) {
        return typeof this.cache[key] != "undefined";
    }
    getCache(key) {
        return this.cache[key];
    }
    getFilename(bak) {
        return `${__dirname}/data/RedCache${this.transId}.json${bak === true ? ".bak" : ""}`;
    }
    loadCache(bak) {
        if (this.fs.existsSync(this.getFilename(bak === true))) {
            try {
                let rawdata = this.fs.readFileSync(this.getFilename(bak === true));
                this.cache = JSON.parse(rawdata);
                if (typeof this.cache != "object") {
                    this.cache = {};
                }
                this.changed = false;
            }
            catch (e) {
                this.cache = {};
                console.error("[RedPersistentCacheHandler] Load error for cache " + this.transId + ". Resetting.", e);
                if (bak !== true) {
                    console.warn("[RedPersistentCacheHandler] Attempting to load backup cache for " + this.transId + ".");
                    this.loadCache(true);
                }
            }
        }
        else {
            console.warn("[RedPersistentCacheHandler] No cache found for " + this.transId + ".");
            if (bak !== true) {
                console.warn("[RedPersistentCacheHandler] Attempting to load backup cache for " + this.transId + ".");
                this.loadCache(true);
            }
        }
    }
    saveCache() {
        if (!this.changed) {
            console.warn("[RedPersistentCacheHandler] Not saving cache as there have been no changes.");
            return;
        }
        let maxSize = trans[this.transId].getOptions().persistentCacheMaxSize * 1024 * 1024;
        let size = this.getSize(JSON.stringify(this.cache));
        for (let key in this.cache) {
            if (size > maxSize) {
                size -= this.getSize(`"${key}":"${this.cache[key]}"`); // good enough of an approximation, we're not going to mars here
                delete (this.cache[key]);
            }
            else {
                break;
            }
        }
        try {
            let write = () => {
                try {
                    this.fs.renameSync(this.getFilename(), this.getFilename(true));
                }
                catch (e) {
                    console.warn("[RedPersistentCacheHandler] Could not create backup. Is the file not there?", e);
                }
                this.fs.writeFile(this.getFilename(), JSON.stringify(this.cache, null, 4), (err) => {
                    this.busy = false;
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log("[RedPersistentCacheHandler] Successfully saved cache.");
                    }
                    let next = this.next;
                    if (typeof next == "function") {
                        this.next = undefined;
                        next();
                    }
                    else {
                        this.busy = false;
                    }
                });
            };
            if (this.busy) {
                this.next = write;
            }
            else {
                this.busy = true;
                write();
            }
        }
        catch (e) {
            console.error("[RedPersistentCacheHandler] Failed saving cache for " + this.transId + ".", e);
        }
    }
    getSize(cache) {
        //return (new TextEncoder().encode(cache)).length;
        return cache.length * 2; // it was too slow, we will assume: HALF IS JAPANESE HALF IS ENGLISH SO 2 BYTES PER CHARACTER, probably still a bit pessimistic, which is good enough of an approximation
    }
}
/// <reference path="RedStringEscaper.ts" />
/// <reference path="RedPersistentCacheHandler.ts" />
const defaultLineStart = `((?:\\r?\\n|^) *　*[◎▲▼▽■□●○★☆♥♡♪＿＊－＝＋＃＄―※〇〔〖〘〚〝｢〈《「『【（［\\[\\({＜<｛｟"'>\\/\\\\]+)`;
const defaultLineEnd = `([\\]\\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩！？。・…‥：；"'.?!;:]+ *　*(?:$|\\r*\\n))`;
const defaultParagraphBreak = `( *　*\\r?\\n(?:\\r?\\n)+ *　*)`;
const openers = `〔〖〘〚〝｢〈《「『【（［\\[\\({＜<｛｟"'`;
const closers = `\\]\\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩"'`;
const mvScript = `\\\\*[A-Z]+[\\[{<][^\\]}>]`;
// RegExp:  not lookbehind: mvScript
//          lookbehind: opener
//          match: anything that's not opener nor closer
//          lookahead: closer
// Result: look for anything that's not opener or closer that is inside opener or closer and not inside an MVScript
const defaultIsolateRegexp = `(?<!(${mvScript}))(?<=[${openers}])([^${openers + closers}])+(?=[${closers}])`;
/**
 * Ideally this would just be a class extension but I don't want to play with EcmaScript 3
 */
class RedTranslatorEngineWrapper {
    constructor(thisAddon, extraOptions, extraSchema, extraForm) {
        this.urls = [];
        this.urlUsage = [];
        this.urlScore = [];
        this.allowTranslation = true;
        this.paused = false;
        this.waiting = [];
        this.cacheHits = 0;
        this.translatorEngine = new TranslatorEngine({
            author: thisAddon.package.author.name,
            version: thisAddon.package.version,
            ...extraOptions,
            splitEnds: true,
            useCache: true,
            usePersistentCache: true,
            persistentCacheMaxSize: 10,
            detectStrings: true,
            mergeSymbols: true,
            isolateSymbols: true,
            rowStart: defaultLineStart,
            rowEnd: defaultLineEnd,
            isolateRegExp: defaultIsolateRegexp,
            optionsForm: {
                "schema": {
                    "splitEnds": {
                        "type": "boolean",
                        "title": "Split Ends",
                        "description": "For added compatibility, symbols that begin or end sentences will not be sent to the translator. This deprives the translator from contextual information, but guarantees the symbol will not be lost nor misplaced. If the symbols at the corners are not actually part of the text this will actually improve translation accuracy while also increasing speed. Recommended is ON.",
                        "default": true
                    },
                    "isolateSymbols": {
                        "type": "boolean",
                        "title": "Isolate Symbols",
                        "description": "Detects and isolates symbols within strings so that they are translated separatedly. A symbol is any text inside brackets or quotes.",
                        "default": true
                    },
                    "useCache": {
                        "type": "boolean",
                        "title": "Use Cache",
                        "description": "To improve speed, every translation sent to Sugoi Translator will be stored in case the same sentence appears again. Depending on the game, this can range from 0% gains to over 50%. There are no downsides, but in case you want to test the translator itself this is left as an option. The cache only lasts until you close Translator++. Recommended is ON.",
                        "default": true
                    },
                    "usePersistentCache": {
                        "type": "boolean",
                        "title": "Use Persistent Cache",
                        "description": "If this option is toggled, the cache will be saved to disk between translations. This can speed up future translations and/or help recover faster after a crash.",
                        "default": true
                    },
                    "persistentCacheMaxSize": {
                        "type": "number",
                        "title": "Persistent Cache Maximum Size",
                        "description": "The maximum size of the translation cache, in Megabytes. Because these are basic text, a few megabytes should be able to hold a large amount of translations. Ideal size is as much memory as you're willing to give to cache / as much bytes as you expect your disk to handle in a timely manner. The cache is saved to disk after each translation batch.",
                        "default": 10,
                        "required": true
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
                    ...extraSchema,
                    "rowStart": {
                        "type": "string",
                        "title": "Line Start Detection",
                        "description": "This Regular Expression is used by the text processor to detect new lines. It is not recommended to change this value.",
                        "default": defaultLineStart,
                        "required": true
                    },
                    "rowEnd": {
                        "type": "string",
                        "title": "Line End Detection",
                        "description": "This Regular Expression is used by the text processor to detect where lines end. It is not recommended to change this value.",
                        "default": defaultLineEnd,
                        "required": true
                    },
                    "isolateRegExp": {
                        "type": "string",
                        "title": "Isolate Symbols",
                        "description": "This regular expression is used to detect Symbols and isolate them to translate separatedly. It is not recommended to change this value.",
                        "default": defaultIsolateRegexp,
                        "required": true
                    },
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
                        "key": "usePersistentCache",
                        "inlinetitle": "Use Persistent Cache",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("usePersistentCache", value);
                        }
                    },
                    {
                        "key": "persistentCacheMaxSize",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("persistentCacheMaxSize", parseFloat(value));
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
                    {
                        "key": "isolateSymbols",
                        "inlinetitle": "Isolate Symbols",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("isolateSymbols", value);
                        }
                    },
                    ...extraForm,
                    {
                        "key": "rowStart",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("rowStart", value);
                        }
                    },
                    {
                        "key": "rowEnd",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("rowEnd", value);
                        }
                    },
                    {
                        "key": "isolateRegExp",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("isolateRegExp", value);
                        }
                    },
                    {
                        "type": "actions",
                        "title": "Reset RegExps",
                        "fieldHtmlClass": "actionButtonSet",
                        "items": [
                            {
                                "type": "button",
                                "title": "Reset RegExps to their default values",
                                "onClick": (evt) => {
                                    try {
                                        window.clicked = evt;
                                        var optionWindow = $((evt.target).parentNode.parentNode);
                                        let engine = this.getEngine();
                                        optionWindow.find(`[name="rowStart"]`).val(defaultLineStart);
                                        optionWindow.find(`[name="rowEnd"]`).val(defaultLineEnd);
                                        optionWindow.find(`[name="isolateRegExp"]`).val(defaultIsolateRegexp);
                                        engine.update("isolateRegExp", defaultIsolateRegexp);
                                        engine.update("rowStart", defaultLineStart);
                                        engine.update("rowEnd", defaultLineEnd);
                                    }
                                    catch (e) {
                                        alert("Failed!" + e.message);
                                    }
                                }
                            },
                            {
                                "type": "button",
                                "title": "Empty Cache (use if the translator is updated with better translations)",
                                "onClick": () => {
                                    this.cacheHandler.resetCache();
                                    this.cacheHandler.saveCache();
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
        this.cacheHandler = new RedPersistentCacheHandler(extraOptions.id);
        this.cacheHandler.loadCache();
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
    isPersistentCaching() {
        let usePersistentCache = this.getEngine().getOptions().usePersistentCache;
        return usePersistentCache == undefined ? true : usePersistentCache == true;
    }
    hasCache(text) {
        return this.cacheHandler.hasCache(text);
    }
    getCache(text) {
        this.cacheHits++;
        return this.cacheHandler.getCache(text);
    }
    setCache(text, translation) {
        this.cacheHandler.addCache(text, translation);
    }
    getCacheHits() {
        return this.cacheHits;
    }
    resetCacheHits() {
        this.cacheHits = 0;
    }
    getRowStart() {
        let option = this.getEngine().getOptions().rowStart;
        if (typeof option == "undefined") {
            return this.getEngine().rowStart;
        }
        else {
            return option;
        }
    }
    getRowEnd() {
        let option = this.getEngine().getOptions().rowEnd;
        if (typeof option == "undefined") {
            return this.getEngine().rowEnd;
        }
        else {
            return option;
        }
    }
    breakRow(text) {
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
                split[k] += split[k + 1];
                split.splice(k + 1, 1);
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
                split[k] += split[k + 1];
                split.splice(k + 1, 1);
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
    isScript(brokenRow) {
        let quoteType = "";
        if (this.isKeepingScripts() && brokenRow.length == 1) {
            let trimmed = brokenRow[0].trim();
            if (["'", '"'].indexOf(trimmed.charAt(0)) != -1 &&
                trimmed.charAt(0) == trimmed.charAt(trimmed.length - 1)) {
                // sure looks like one, but is it?
                try {
                    quoteType = trimmed.charAt(0);
                    // RPG Maker has their own "escaped" symbols which are not valid in JSON
                    trimmed = trimmed.replace(/\\(?=[^rn"'])/g, '\\\\');
                    if (quoteType == "'") {
                        // These are actually invalid, so... extra work for us.
                        trimmed = trimmed.replace(/"/g, '\\"');
                        trimmed = '"' + trimmed.substring(1, trimmed.length - 1) + '"';
                        // It's okay, we'll go back to the original quoteType later.
                    }
                    let innerString = JSON.parse(trimmed);
                    return {
                        isScript: true,
                        quoteType: quoteType,
                        newLine: innerString
                    };
                }
                catch (e) {
                    console.warn("[REDSUGOI] I thought it was a script but it wasn't. Do check.", brokenRow[0], trimmed, e);
                }
            }
        }
        return { isScript: false };
    }
    curateRow(row) {
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
            lines = this.breakRow(scriptCheck.newLine);
        }
        let curated = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            let escaped = new RedStringEscaper(line, {
                type: escapingType,
                splitEnds: splitEnds,
                mergeSymbols: mergeSymbols,
                noUnks: true,
                isolateSymbols: isolateSymbols,
                isolateRegExp: isolateRegExp,
            });
            curated.push(escaped);
        }
        return { scriptCheck: scriptCheck,
            lines: curated };
    }
    translate(rows, options) {
        let batchStart = new Date().getTime();
        options = options || {};
        options.onAfterLoading = options.onAfterLoading || function () { };
        options.onError = options.onError || function () { };
        options.always = options.always || function () { };
        if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
            ui.showBusyOverlay();
        }
        // Unpause if paused
        this.resume(true);
        this.allowTranslation = true;
        // Set up T++ result object
        let result = {
            'sourceText': rows.join(),
            'translationText': "",
            'source': rows,
            'translation': []
        };
        // First step: curate every single line and keep track of it
        let rowHandlers = [];
        let toTranslateOr = [];
        let toTranslate = [];
        let toTranslateIndex = [];
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
            }
            else {
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
                this.log(`[RedTranslatorEngine] Avoided translating ${translations.length - translationsNoDupes.length} duplicate strings.`);
            }
            // Fourth step: return translations to each object
            let curatedIndex = 0;
            let internalIndex = 0;
            let finalTranslations = [];
            let curated = rowHandlers[curatedIndex];
            // Move through translations
            let moveRows = () => {
                while (curated != undefined && curated.isDone(internalIndex)) {
                    curated.applyTranslation();
                    finalTranslations.push(curated.getTranslatedRow());
                    internalIndex = 0;
                    curated = rowHandlers[++curatedIndex];
                }
            };
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
            let seconds = Math.round((batchEnd - batchStart) / 100) / 10;
            this.log(`[RedTranslatorEngine] Batch took: ${seconds} seconds, which was about ${Math.round(10 * result.sourceText.length / seconds) / 10} characters per second!`);
            this.log(`[RedTranslatorEngine] Translated ${rows.length} rows (${Math.round(10 * rows.length / seconds) / 10} rows per second).`);
            let hits = this.getCacheHits();
            this.resetCacheHits();
            if (hits > 0) {
                this.log(`[RedTranslatorEngine] Skipped ${hits} translations through cache hits!`);
            }
            if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
                ui.hideBusyOverlay();
            }
            if (this.isPersistentCaching()) {
                this.log("[RedTranslatorEngine] Saving translation cache to file.");
                this.cacheHandler.saveCache();
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
/// <reference path="RedTranslatorEngine.ts" />
/// <reference path="RedStringEscaper.ts" />
class RedSugoiEngine extends RedTranslatorEngineWrapper {
    /**
     * Updates URL array and picks the one with the least connections
     * @returns string
     */
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
            this.urlScore[idx]--; // shame on you little server.
        }
    }
    updateUrls() {
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
    // Goals of refactor:
    // Split rows evenly between servers in single requests that respect maximum simultaneous translations.
    doTranslate(toTranslate, options) {
        this.resetScores();
        console.log("[REDSUGOI] TRANSLATE:\n", toTranslate, options);
        let translating = 0;
        let translations = [];
        // Set up progress
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
        let complete;
        // Third step: perform translations
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
                            if (this.isCaching()) {
                                this.setCache(myLines[i], result[i]);
                            }
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
                // return the object
                onSuccess(translations);
                // Update progress
                let pre = document.createElement("pre");
                pre.appendChild(document.createTextNode("[RedSugoi] Batch Translated! Best servers were:"));
                let servers = [...this.urls];
                servers.sort((a, b) => {
                    return this.urlScore[this.urls.indexOf(b)] - this.urlScore[this.urls.indexOf(a)];
                });
                for (let i = 0; i < servers.length; i++) {
                    pre.appendChild(document.createTextNode(`\n[RedSugoi] #${i + 1} - ${servers[i]} (${this.urlScore[this.urls.indexOf(servers[i])]} translations)`));
                }
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
            escapeAlgorithm: RedPlaceholderType.poleposition,
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
                "description": "Escaping algorithm used for the Custom Escaper Patterns. For Sugoi Translator, it is recommended to use Poleposition Placeholder, which replaces symbols with a hashtag followed by a short number. MV Style and Wolf Style also appear to be somewhat consistent (MV more than Wolf style). No particular reason, they just seems to break the least.",
                "default": RedPlaceholderType.poleposition,
                "required": false,
                // @ts-ignore shhh it's fine don't worry bb
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
                    },
                    {
                        "type": "button",
                        "title": "Copy Sugoi Trans Server Values",
                        "onClick": (evt) => {
                            try {
                                window.clicked = evt;
                                var optionWindow = $((evt.target).parentNode.parentNode);
                                let engine = this.getEngine();
                                optionWindow.find(`[name="targetUrl"]`).val(trans.sugoitrans.targetUrl);
                                engine.update("targetUrl", trans.sugoitrans.targetUrl);
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
/// <reference path="RedTranslatorEngine.ts" />
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
            innerDelay: 6000,
            maximumBatchSize: 1800,
            skipReferencePair: true,
            lineDelimiter: "<br>",
            mode: "rowByRow",
            escapeAlgorithm: RedPlaceholderType.privateUse,
        }, {
            "escapeAlgorithm": {
                "type": "string",
                "title": "Code Escaping Algorithm",
                "description": "Escaping algorithm used for the Custom Escaper Patterns. For Google, it is recommended to use Tag placeholder, as Google tries to not break tags.",
                "default": RedPlaceholderType.privateUse,
                "required": false,
                // @ts-ignore shhh it's fine don't worry bb
                "enum": RedPlaceholderTypeArray
            },
        }, []);
        this.lastRequest = 0;
        this.delayed = [];
    }
    doTranslate(toTranslate, options) {
        let sourceLanguage = trans.getSl();
        let destinationLanguage = trans.getTl();
        let translating = 0;
        let translations = new Array(toTranslate.length);
        let maxBatchSize = this.getEngine().maximumBatchSize;
        let delay = this.getEngine().innerDelay;
        //let rowSeparator = "<newrowmarker>";
        let rowSeparator = this.getEngine().lineSubstitute;
        //let rowSeparator = String.fromCodePoint(983040); // Cool in theory, not that cool in practice
        let progressCurrent = document.createTextNode("0");
        let progressTotal = document.createTextNode("/" + toTranslate.length);
        let currentAction = document.createTextNode("Starting up...");
        this.print(document.createTextNode("[Red Google] Translating current batch: "), progressCurrent, progressTotal, document.createTextNode(" - "), currentAction);
        let batchStart = 0;
        let translate = (onSuccess, onError) => {
            if (translating >= toTranslate.length) {
                currentAction.nodeValue = "Done!";
                return onSuccess(translations);
            }
            currentAction.nodeValue = "Gathering strings...";
            let batch = [];
            let batchSize = 0;
            batchStart = translating;
            let calcBatchSize = (addition) => {
                return addition.length + batchSize + (rowSeparator.length * batch.length);
            };
            // If for some reason we get one huge ass translation, we send it alone
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
                    q: batch.join("\n" + rowSeparator)
                }),
                //headers		: { 'Content-Type': 'application/json' },
            }).then((data) => {
                currentAction.nodeValue = "Reading response...";
                let googleTranslations = data[0]; // Each line becomes a translation...
                let uglyTranslations = [];
                for (let i = 0; i < googleTranslations.length; i++) {
                    uglyTranslations.push(googleTranslations[i][0]);
                }
                let cleanTranslations = uglyTranslations.join("\n");
                // Google doesn't destroy tags, but it adds spaces... "valid HTML" I guess.
                cleanTranslations = cleanTranslations.replaceAll(/ *< */g, "<");
                cleanTranslations = cleanTranslations.replaceAll(/ *> */g, ">");
                // Fuck empty lines
                cleanTranslations = cleanTranslations.replaceAll(/[\n]{2,}/g, "\n");
                // Fuck spaces at the end of lines
                cleanTranslations = cleanTranslations.replaceAll(/ *\n/g, "\n");
                // Case consistency
                cleanTranslations = cleanTranslations.replaceAll(new RegExp(rowSeparator, "gi"), rowSeparator);
                // we want to ignore line breaks on the sides of the row separator
                cleanTranslations = cleanTranslations.replaceAll("\n" + rowSeparator, rowSeparator);
                cleanTranslations = cleanTranslations.replaceAll(rowSeparator + "\n", rowSeparator);
                // Japanese loves repeating sentence enders !!!
                // Google does not
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
                        translations[batchStart + i] = pristineTranslations[i].trim(); // Google loves spaces...
                        if (this.isCaching()) {
                            this.setCache(toTranslate[batchStart + i], pristineTranslations[i]);
                        }
                    }
                    progressCurrent.nodeValue = (parseInt(progressCurrent.nodeValue) + pristineTranslations.length).toString();
                }
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
/// <reference path="RedTranslatorEngine.ts" />
function getCarryTitleMap(array) {
    if (array) {
        return [...trans.translator];
    }
    let titleMap = {};
    for (let i = 0; i < trans.translator.length; i++) {
        let id = trans.translator[i];
        try {
            if (trans[id] != undefined) {
                titleMap[trans[id].id] = trans[id].name;
            }
        }
        catch (e) { }
    }
    return titleMap;
}
class RedPiggybackEngine extends RedTranslatorEngineWrapper {
    constructor(thisAddon) {
        super(thisAddon, {
            id: "redpiggyback",
            name: "Red Piggyback Translator",
            description: "Uses Red Text Processor on one of the default translators. Why write many code when few code do trick?",
            batchDelay: 1,
            skipReferencePair: true,
            maxRequestLength: Number.MAX_VALUE,
            lineDelimiter: "<br>",
            mode: "rowByRow",
            carryId: 'transredsugoi',
        }, {
            "carryId": {
                "type": "string",
                "title": "Translator to Use",
                "description": "Sets which translator will be used by Piggyback.",
                "default": "redsugoi",
                "required": false,
                "enum": getCarryTitleMap(true)
            },
            "escapeAlgorithm": {
                "type": "string",
                "title": "Code Escaping Algorithm",
                "description": "Escaping algorithm used for the Custom Escaper Patterns. Best one will depend on the translator being used.",
                "default": RedPlaceholderType.tagPlaceholder,
                "required": false,
                // @ts-ignore shhh it's fine don't worry bb
                "enum": RedPlaceholderTypeArray
            },
        }, [
            {
                "key": "carryId",
                "titleMap": getCarryTitleMap(false),
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    this.translatorEngine.update("carryId", value);
                }
            },
        ]);
        this.lastRequest = 0;
        this.delayed = [];
    }
    delay(callback, engineDelay) {
        let now = (new Date()).getTime();
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
    doTranslate(toTranslate, options) {
        let batchAction = document.createTextNode("Starting up");
        let progressCurrent = document.createTextNode("0");
        let progressTotal = document.createTextNode("/" + toTranslate.length.toString());
        this.print(document.createTextNode("[RedPiggyBackEngine] Current Batch: "), progressCurrent, progressTotal, document.createTextNode(" - Current Action: "), batchAction);
        return new Promise((resolve, reject) => {
            let targetTrans = trans[this.getEngine().carryId];
            if (targetTrans == undefined) {
                batchAction.nodeValue = "Ended - No valid translator";
                this.error("The selected translator (" + this.getEngine().carryId + ") is invalid or unavailable.");
                reject("The selected Translator Engine does not exist or is not available.");
            }
            else {
                let newOptions = { ...options };
                newOptions.onAfterLoading = (result) => {
                    batchAction.nodeValue = "Receiving Translations...";
                    if (result.translation.length != toSend.length) {
                        batchAction.nodeValue = "Ended - Translator returned invalid response";
                        this.error("[RedPiggybackEngine] Received invalid response. Sent " + toTranslate.length.toString() + " sentences and got " + result.translation.length + " back. Skipping.");
                        reject("Mismatched translations.");
                    }
                    else {
                        for (let i = 0; i < result.translation; i++) {
                            let idx = i + translating++;
                            translations[idx] = result.translation[i];
                            if (this.isCaching()) {
                                this.setCache(toTranslate[idx], translations[idx]);
                            }
                        }
                        progressCurrent.nodeValue = translating.toString();
                        if (translating >= toTranslate.length) {
                            batchAction.nodeValue = "Ended - Batch done";
                            resolve(translations);
                        }
                        else {
                            batchAction.nodeValue = "Awaiting internal delay...";
                            this.delay(doAction, targetTrans.batchDelay);
                        }
                    }
                };
                newOptions.onError = (reason) => {
                    this.error("[RedPiggybackEngine] " + reason);
                    reject(reason);
                };
                let sending = 0;
                let translating = 0;
                let translations = new Array(toTranslate.length);
                let toSend = [];
                let maxLength = targetTrans.maxRequestLength;
                let doAction = () => {
                    let sentLength = 0;
                    toSend = [];
                    while (sending < toTranslate.length &&
                        (sentLength + toTranslate[sending].length < maxLength || sentLength == 0)) {
                        sentLength += toTranslate[sending].length;
                        toSend.push(toTranslate[sending++]);
                    }
                    if (toSend.length > 0) {
                        targetTrans.translate(toSend, newOptions);
                    }
                    else {
                        resolve(translations);
                    }
                };
                this.delay(doAction, targetTrans.batchDelay);
            }
        });
    }
    resetForm() {
        this.getEngine().optionsForm.schema.carryId.enum = getCarryTitleMap(true);
        this.getEngine().optionsForm.sechema.carryId.enum = getCarryTitleMap(true);
        this.getEngine().optionsForm.form.carryId.enum = getCarryTitleMap(false);
    }
}
/// <reference path="classes/RedSugoiEngine.ts" />
/// <reference path="classes/RedGoogleEngine.ts" />
/// <reference path="classes/RedPiggybackEngine.ts" />
var thisAddon = this;
let wrappers = [
    new RedSugoiEngine(thisAddon),
    new RedGoogleEngine(thisAddon),
];
let piggy = new RedPiggybackEngine(thisAddon);
wrappers.forEach(wrapper => {
    trans[wrapper.getEngine().id] = wrapper.getEngine();
});
//trans[piggy.getEngine().id] = piggy.getEngine();
$(document).ready(() => {
    wrappers.forEach(wrapper => {
        wrapper.getEngine().init();
    });
    /* piggy.getEngine().init();

    setTimeout(() => {
        piggy.resetForm();
    }, 500); */
});
class RedStringRowHandler {
    constructor(row, wrapper) {
        this.curatedLines = [];
        this.extractedLines = [];
        this.translatableLines = [];
        this.translatableLinesIndex = [];
        this.translatedLines = [];
        this.isScript = false;
        this.quoteType = "'";
        this.originalRow = row;
        let processed = wrapper.curateRow(row);
        if (processed.scriptCheck.isScript) {
            this.setScript(processed.scriptCheck.quoteType);
        }
        this.curatedLines = processed.lines;
        for (let i = 0; i < this.curatedLines.length; i++) {
            let curated = this.curatedLines[i];
            this.curatedLines.push(...curated.getExtractedStrings());
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
        let lastline = "";
        for (let i = 0; i < this.curatedLines.length; i++) {
            let curated = this.curatedLines[i];
            if (curated.isExtracted()) {
                continue; // we don't touch these
            }
            let line = curated.recoverSymbols();
            line = line.trim();
            // Keep empty lines so long as:
            // It's not the first line
            // The previous line wasn't also blank
            if (line != "" || (i > 0 && lastline != "")) {
                lines.push(line);
            }
            lastline = line;
        }
        let result = lines.join("\n");
        if (this.isScript) {
            result = JSON.stringify(result);
            if (result.charAt(0) != this.quoteType) {
                // escape the quotes
                result = result.replaceAll(this.quoteType, `\\${this.quoteType}`);
                result = this.quoteType + result.substring(1, result.length - 1) + this.quoteType;
            }
        }
        return result;
    }
    setScript(quoteType) {
        this.isScript = true;
        this.quoteType = quoteType;
    }
    getTranslatableLines() {
        return [...this.translatableLines];
    }
    insertTranslation(text, index) {
        this.translatedLines[index] = text;
    }
    applyTranslation() {
        for (let i = 0; i < this.translatedLines.length; i++) {
            // Some of them might be undefined
            // Ideally we'd check outside, but we need to keep moving forward while translating.
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
