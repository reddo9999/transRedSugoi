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
    privateUse = "privateUse"
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
    privateUse = "Supplementary Private Use Area-A (\uD83D\uDC7D)"
}
declare let RedPlaceholderTypeArray: RedPlaceholderType[];
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
    private isScript;
    private quoteType;
    constructor(text: string, scriptCheck: RedScriptCheckResponse, type?: RedPlaceholderType, splitEnds?: boolean, mergeSymbols?: boolean, noUnks?: boolean);
    break(): void;
    getTag(): string;
    getClosedTag(): string;
    getFullTag(): string;
    getPolePosition(): string;
    getHexPlaceholder(): string;
    getCurly(): string;
    getDoubleCurly(): string;
    getClosedNines(): string;
    getPrivateArea(): string;
    storeSymbol(text: string): string;
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
    constructor(id: string);
    addCache(key: string, translation: string): void;
    hasCache(key: string): boolean;
    getCache(key: string): string;
    getFilename(): string;
    loadCache(): void;
    saveCache(): void;
    getSize(cache: string): number;
}
declare var ui: any;
interface RedScriptCheckResponse {
    isScript: boolean;
    quoteType?: string;
    newLine?: string;
}
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
    breakRow(text: string): Array<string>;
    isScript(brokenRow: Array<string>): RedScriptCheckResponse;
    curateRow(row: string): Array<RedStringEscaper>;
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
declare var thisAddon: any;
declare let wrappers: (RedSugoiEngine | RedGoogleEngine)[];
declare var trans: any;
declare class RedStringRowHandler {
    private originalRow;
    private curatedLines;
    private translatableLines;
    private translatableLinesIndex;
    private translatedLines;
    constructor(row: string, wrapper: RedTranslatorEngineWrapper);
    getOriginalRow(): string;
    getTranslatedRow(): string;
    getTranslatableLines(): string[];
    insertTranslation(text: string, index: number): void;
    applyTranslation(): void;
    isDone(index: number): boolean;
}
