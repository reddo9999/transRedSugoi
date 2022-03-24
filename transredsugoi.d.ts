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
    private splitEndsRegEx;
    private removeUnks;
    private mergeSymbols;
    private closedNinesLength;
    private storedSymbols;
    private reverseSymbols;
    private currentText;
    private broken;
    private symbolOrder;
    private preString;
    private postString;
    private counters;
    private letters;
    private privateArea;
    private extractedStrings;
    private extractedKeys;
    private wasExtracted;
    private splitArray;
    constructor(text: string, options: {
        type: RedPlaceholderType;
        splitEnds: boolean;
        splitEndsRegEx: RegExp;
        mergeSymbols: boolean;
        noUnks: boolean;
        isolateSymbols: boolean;
        isolateRegExp: string;
        isExtracted?: boolean;
        aggressivelySplit?: RegExp;
    });
    addSplitTranslatable(text: string, options: any): void;
    addSplitText(text: string, options: any): void;
    isExtracted(): boolean;
    getExtractedStrings(): RedStringEscaper[];
    break(): void;
    /**
     * Ideally we'd make something that works just the same as the hex placeholder, but I'm currently too drunk to analyze it
     * So I'll just make something that's hopefully similar enough to live through updates!
     */
    escape(): string;
    recoverSymbols(): string;
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
    static cachedFormulaString: string;
    static cachedFormulas: Array<RegExp | Function>;
    static getActiveFormulas(): (Function | RegExp)[];
    static renderFunction(string: string): any;
    storeSymbol(text: string): string;
    correctSymbolBreaking(): void;
}
declare class RedPersistentCacheHandler {
    private fs;
    private transId;
    private cache;
    private changed;
    private busy;
    private next;
    private maximumCacheHitsOnLoad;
    private cacheDegradationLevel;
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
declare class RedPerformance {
    private perfStart;
    private perfEnd;
    end(): void;
    getSeconds(): number;
}
declare var ui: any;
interface RedScriptCheckResponse {
    isScript: boolean;
    quoteType?: string;
    newLine?: string;
}
declare const defaultSymbols = "\u25C6\u25CE\u2605\u25A0\u2606\u3007\u25A1\u25B3\u25CF\u2642\u2640\u26A4\u26A2\u26A8\u26A3\u26A9\u26A7\u2E38\u271E\u2626\u271D\u271F\u2671\u2625\u2641\u2719\u26B0\uFE0F\u26E7\u2661\u2665\u2764\u2666\u2663\u2660\u2022\u25D8\u25CB\u25D9\u2642\u2640\u266A\u266B\u25BA\u25C4\u25B2\u25BC\u2191\u2190\u2191\u2192\u2193\u2193\u2192\u2190\u2194\u203B\uFF0A\u303D\u3013\u266A\u266B\u266C\u2669\u3007\u3012\u3036\u3020\u3004\u24CD\u24C1\u24CE";
declare const defaultParagraphBreak = "( *\u3000*\\r?\\n(?:\\r?\\n)+ *\u3000*\t*)";
declare const defaultPunctuation = "\uFF01\uFF1F\u3002\u30FB\u2026\u2025\uFF1A\uFF1B.?!;:";
declare const openerRegExp = "\u3014\u3016\u3018\u301A\u301D\uFF62\u3008\u300A\u300C\u300E\u3010\uFF08\uFF3B\\[\\({\uFF1C<\uFF5B\uFF5F\"'";
declare const defaultLineStart: string;
declare const closerRegExp = "\\]\\)}\u3015\u3017\u3019\u301B\u301E\u201D\uFF63\u3009\u300B\u300D\u300F\u3011\uFF09\uFF3D\uFF1E>\uFF5D\uFF60\u301F\u27E9\"'";
declare const defaultLineEnd: string;
declare const rmColorRegExp = "\\\\C\\[.+?\\]";
declare const mvScript = "\\\\*[NV]";
declare const defaultIsolateRegexp: string;
declare const defaultSplitRegExp = "((?:\\\\?r?\\\\n)+)|(\\\\[.!])";
declare const defaultSplitEndsRegExp: string;
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
    hasCache(text: string): boolean | undefined;
    getCache(text: string): string;
    setCache(text: string, translation: string): void;
    getCacheHits(): number;
    resetCacheHits(): void;
    getRowStart(): any;
    getRowEnd(): any;
    breakRow(text: string): Array<string>;
    isScript(brokenRow: Array<string>): RedScriptCheckResponse;
    getOption(id: string, defaultValue: any): any;
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
declare function t(text: string): string;
declare class RedButtonManagerButton {
    name: string;
    icon: string;
    title: string;
    action: () => void | Promise<void>;
    private element;
    constructor(name: string, icon: string, title: string, action: () => void | Promise<void>);
    setIcon(icon: string): void;
    getButton(): HTMLButtonElement;
}
declare var thisAddon: any;
declare let wrappers: (RedSugoiEngine | RedGoogleEngine)[];
declare let piggy: RedPiggybackEngine;
declare var trans: any;
declare var engines: any;
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
declare class RedTranslatableString {
    private index;
    private text;
    constructor(index: number, text: string);
    setText(text: string): void;
    getIndex(): number;
    getText(): string;
    getLength(): number;
}
