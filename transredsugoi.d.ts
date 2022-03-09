declare var sys: any;
declare var common: any;
declare enum RedPlaceholderType {
    poleposition = "poleposition",
    hexPlaceholder = "hexPlaceholder",
    noEscape = "noEscape",
    ninesOfRandomness = "ninesOfRandomness",
    tagPlaceholder = "tagPlaceholder",
    closedTagPlaceholder = "closedTagPlaceholder",
    fullTagPlaceholder = "fullTagPlaceholder",
    curlie = "curlie",
    doubleCurlie = "doubleCurlie",
    privateUse = "privateUse",
    hashtag = "hashtag",
    hashtagTriple = "hashtagTriple",
    tournament = "tournament",
    mvStyle = "mvStyle",
    wolfStyle = "wolfStyle",
    percentage = "percentage",
    mvStyleLetter = "mvStyleLetter",
    sugoiTranslatorSpecial = "sugoiTranslatorSpecial",
    sugoiTranslatorSpecial2 = "sugoiTranslatorSpecial2"
}
declare enum RedPlaceholderTypeNames {
    poleposition = "Poleposition (e.g. #24)",
    hexPlaceholder = "Hex Placeholder (e.g. 0xffffff)",
    noEscape = "No escaping (will translate everything)",
    ninesOfRandomness = "Closed Nines (e.g. 9123412349)",
    tagPlaceholder = "Tag Placeholder (e.g. &lt;24&gt;)",
    closedTagPlaceholder = "Tag Placeholder Closed Tags (e.g. &lt;24/&gt;)",
    fullTagPlaceholder = "Tag Placeholder Full XML-style Tag (e.g. &lt;24&gt;&lt;/24&gt;)",
    curlie = "Curlies (e.g. letter enclosed by curly brackets)",
    doubleCurlie = "Double Curlies (e.g. letter enclosed by two curly brackets on each side)",
    privateUse = "Supplementary Private Use Area-A (\uD83D\uDC7D)",
    hashtag = "Hashtag (#A)",
    hashtagTriple = "Triple Hashtag (#ABC)",
    tournament = "Tournament (e.g. #1, #2, #3)",
    mvStyle = "MV Message (e.g. %1, %2, %3)",
    mvStyleLetter = "MV Message but with Letters (e.g. %A, %B, %C)",
    wolfStyle = "Wolf Message (e.g. @1, @2, @3)",
    percentage = "Actual Percentage (e.g. 1%, 2%)",
    sugoiTranslatorSpecial = "ivdos' Special (e.g. @#1, @#2)",
    sugoiTranslatorSpecial2 = "ivdos' Special with Letters (e.g. @#A, @#B)"
}
declare let RedPlaceholderTypeArray: RedPlaceholderType[];
declare const regExpObj: any;
declare const regExpExists: any;
declare let escapingTitleMap: {
    [id: string]: string;
};
declare class RedStringEscaper {
    private text;
    private type;
    private splitEnds;
    private removeUnks;
    private mergeSymbols;
    private symbolAffix;
    private currentSymbol;
    private hexCounter;
    private closedNinesLength;
    private storedSymbols;
    private reverseSymbols;
    private currentText;
    private broken;
    private curlyCount;
    private privateCounter;
    private preString;
    private postString;
    private hashtagOne;
    private hashtagTwo;
    private hashtagThree;
    private extractedStrings;
    private extractedKeys;
    private wasExtracted;
    storeSymbol(text: string): string;
    constructor(text: string, options: {
        type?: RedPlaceholderType;
        splitEnds?: boolean;
        mergeSymbols?: boolean;
        noUnks?: boolean;
        isolateSymbols?: boolean;
        isolateRegExp?: string;
        isExtracted?: boolean;
    });
    isExtracted(): boolean;
    getExtractedStrings(): RedStringEscaper[];
    break(): void;
    getTag(): string;
    getClosedTag(): string;
    getFullTag(): string;
    getPolePosition(): string;
    getMvStyle(): string;
    getMvStyleLetter(): string;
    getWolfStyle(): string;
    getHexPlaceholder(): string;
    getCurly(): string;
    getDoubleCurly(): string;
    getClosedNines(): string;
    getPrivateArea(): string;
    getHashtag(): string;
    getTripleHashtag(): string;
    getTournament(): string;
    getPercentage(): string;
    getSugoiSpecial(): string;
    getSugoiSpecial2(): string;
    getOriginalText(): string;
    getReplacedText(): string;
    setTranslatedText(text: string): void;
    recoverSymbols(): string;
    /**
     * Ideally we'd make something that works just the same as the hex placeholder, but I'm currently too drunk to analyze it
     * So I'll just make something that's hopefully similar enough to live through updates!
     */
    escape(): string;
    static cachedFormulaString: string;
    static cachedFormulas: Array<RegExp | Function>;
    static getActiveFormulas(): (Function | RegExp)[];
    static renderFunction(string: string): any;
}
declare class RedPersistentCacheHandler {
    private fs;
    private transId;
    private cache;
    private changed;
    private busy;
    private next;
    private maximumCacheHitsOnLoad;
    constructor(id: string);
    addCache(key: string, translation: string): void;
    resetCache(): void;
    hasCache(key: string): boolean;
    getCache(key: string): string;
    getFilename(bak?: boolean): string;
    loadCache(bak?: boolean): void;
    saveCache(): void;
    getSize(cache: string): number;
}
declare var ui: any;
interface RedScriptCheckResponse {
    isScript: boolean;
    quoteType?: string;
    newLine?: string;
}
declare const defaultLineStart = "((?:\\r?\\n|^) *\u3000*[\u25CE\u25B2\u25BC\u25BD\u25A0\u25A1\u25CF\u25CB\u2605\u2606\u2665\u2661\u266A\uFF3F\uFF0A\uFF0D\uFF1D\uFF0B\uFF03\uFF04\u2015\u203B\u3007\u3014\u3016\u3018\u301A\u301D\uFF62\u3008\u300A\u300C\u300E\u3010\uFF08\uFF3B\\[\\({\uFF1C<\uFF5B\uFF5F\"'>\\/\\\\]+)";
declare const defaultLineEnd = "([\\]\\)}\u3015\u3017\u3019\u301B\u301E\u201D\uFF63\u3009\u300B\u300D\u300F\u3011\uFF09\uFF3D\uFF1E>\uFF5D\uFF60\u301F\u27E9\uFF01\uFF1F\u3002\u30FB\u2026\u2025\uFF1A\uFF1B\"'.?!;:]+ *\u3000*(?:$|\\r*\\n))";
declare const defaultParagraphBreak = "( *\u3000*\\r?\\n(?:\\r?\\n)+ *\u3000*)";
declare const openerRegExp = "\u3014\u3016\u3018\u301A\u301D\uFF62\u3008\u300A\u300C\u300E\u3010\uFF08\uFF3B\\[\\({\uFF1C<\uFF5B\uFF5F\"'";
declare const closerRegExp = "\\]\\)}\u3015\u3017\u3019\u301B\u301E\u201D\uFF63\u3009\u300B\u300D\u300F\u3011\uFF09\uFF3D\uFF1E>\uFF5D\uFF60\u301F\u27E9\"'";
declare const rmColorRegExp = "\\\\C\\[.+?\\]";
declare const mvScript = "\\\\*[V]+";
declare const defaultIsolateRegexp: string;
/**
 * Ideally this would just be a class extension but I don't want to play with EcmaScript 3
 */
declare abstract class RedTranslatorEngineWrapper {
    protected translatorEngine: TranslatorEngine;
    protected urls: Array<string>;
    protected urlUsage: Array<number>;
    protected urlScore: Array<number>;
    protected allowTranslation: boolean;
    protected paused: boolean;
    protected waiting: Array<Function>;
    protected cacheHandler: RedPersistentCacheHandler;
    getEngine(): TranslatorEngine;
    abort(): void;
    pause(): void;
    resume(reset?: boolean): void;
    isCaching(): boolean;
    isKeepingScripts(): boolean;
    isMergingSymbols(): boolean;
    isPersistentCaching(): boolean;
    private cacheHits;
    hasCache(text: string): boolean;
    getCache(text: string): string;
    setCache(text: string, translation: string): void;
    getCacheHits(): number;
    resetCacheHits(): void;
    getRowStart(): any;
    getRowEnd(): any;
    breakRow(text: string): Array<string>;
    isScript(brokenRow: Array<string>): RedScriptCheckResponse;
    curateRow(row: string): {
        scriptCheck: RedScriptCheckResponse;
        lines: Array<RedStringEscaper>;
    };
    abstract doTranslate(toTranslate: Array<string>, options: TranslatorEngineOptions): Promise<Array<string>>;
    translate(rows: Array<string>, options: any): void;
    log(...texts: Array<string>): void;
    error(...texts: Array<string>): void;
    print(...elements: Array<Element | Text>): void;
    printError(...elements: Array<Element | Text>): void;
    isValidHttpUrl(urlString: string): boolean;
    constructor(thisAddon: any, extraOptions: {
        [id: string]: any;
    }, extraSchema: {
        [id: string]: TranslationEngineOptionSchema<any>;
    }, extraForm: Array<TranslationEngineOptionFormUpdater>);
}
declare class RedSugoiEngine extends RedTranslatorEngineWrapper {
    /**
     * Updates URL array and picks the one with the least connections
     * @returns string
     */
    getUrl(): string;
    reduceScore(url: string): void;
    updateUrls(): void;
    getUrlCount(): number;
    freeUrl(url: string): void;
    resetScores(): void;
    doTranslate(toTranslate: string[], options: TranslatorEngineOptions): Promise<Array<string>>;
    constructor(thisAddon: any);
}
declare class RedGoogleEngine extends RedTranslatorEngineWrapper {
    doTranslate(toTranslate: string[], options: TranslatorEngineOptions): Promise<Array<string>>;
    private lastRequest;
    private delayed;
    delay(callback: Function): void;
    abort(): void;
    constructor(thisAddon: any);
}
declare function getCarryTitleMap(array?: boolean): Array<string> | {
    [id: string]: string;
};
declare class RedPiggybackEngine extends RedTranslatorEngineWrapper {
    private lastRequest;
    private delayed;
    delay(callback: Function, engineDelay: number): void;
    abort(): void;
    doTranslate(toTranslate: Array<string>, options: TranslatorEngineOptions): Promise<Array<string>>;
    resetForm(): void;
    constructor(thisAddon: any);
}
declare var thisAddon: any;
declare let wrappers: (RedSugoiEngine | RedGoogleEngine)[];
declare let piggy: RedPiggybackEngine;
declare var trans: any;
declare class RedBatchTranslatorButton {
    private panel;
    private button;
    private parent;
    constructor(parent: RedBatchTranslator);
}
declare class RedBatchTranslatorWindow {
    private parent;
    private container;
    constructor(parent: RedBatchTranslator);
    open(): void;
    close(): void;
}
declare class RedBatchTranslatorRow {
    private location;
    constructor(file: string, index: number);
    getValue(): any;
    isTranslated(): boolean;
    setValue(text: string, destination: number): void;
    getTags(): any;
}
declare class RedBatchTranslator {
    private button;
    private window;
    constructor();
    open(): void;
    close(): void;
    translateProject(options: {
        translator: string;
        destination: number;
        ignoreTranslated: boolean;
        blacklist: Array<string>;
        whitelist: Array<string>;
        files: Array<string>;
        strict: boolean;
        saveOnEachBatch: boolean;
    }): void;
}
declare class RedStringRowHandler {
    private originalRow;
    private curatedLines;
    private extractedLines;
    private translatableLines;
    private translatableLinesIndex;
    private translatedLines;
    private isScript;
    private quoteType;
    constructor(row: string, wrapper: RedTranslatorEngineWrapper);
    getOriginalRow(): string;
    getTranslatedRow(): string;
    setScript(quoteType: string): void;
    getTranslatableLines(): string[];
    insertTranslation(text: string, index: number): void;
    applyTranslation(): void;
    isDone(index: number): boolean;
}
