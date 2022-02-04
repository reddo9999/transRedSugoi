declare var sys: any;
declare var common: any;
declare enum RedPlaceholderType {
    poleposition = "poleposition",
    hexPlaceholder = "hexPlaceholder",
    noEscape = "noEscape",
    ninesOfRandomness = "closedNines",
    tagPlaceholder = "tagPlaceholder",
    closedTagPlaceholder = "closedTagPlaceholder",
    fullTagPlaceholder = "fullTagPlaceholder"
}
declare enum RedPlaceholderTypeNames {
    poleposition = "Poleposition (e.g. #24)",
    hexPlaceholder = "Hex Placeholder (e.g. 0xffffff)",
    noEscape = "No escaping (will translate everything)",
    ninesOfRandomness = "Closed Nines (e.g. 9123412349)",
    tagPlaceholder = "Tag Placeholder (e.g. <24>)",
    closedTagPlaceholder = "Tag Placeholder Closed Tags (e.g. <24/>)",
    fullTagPlaceholder = "Tag Placeholder Full XML-style Tag (e.g. <24></24>)"
}
declare let RedPlaceholderTypeArray: RedPlaceholderType[];
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
    private preString;
    private postString;
    private isScript;
    private quoteType;
    constructor(text: string, scriptCheck: RedScriptCheckResponse, type?: RedPlaceholderType, splitEnds?: boolean, mergeSymbols?: boolean, noUnks?: boolean);
    getTag(): string;
    getClosedTag(): string;
    getFullTag(): string;
    getPolePosition(): string;
    getHexPlaceholder(): string;
    getClosedNines(): string;
    storeSymbol(text: string): string;
    getOriginalText(): string;
    getReplacedText(): string;
    setTranslatedText(text: string): void;
    recoverSymbols(): string;
    escape(): string;
    static cachedFormulaString: string;
    static cachedFormulas: Array<RegExp | Function>;
    static getActiveFormulas(): (Function | RegExp)[];
    static renderFunction(string: string): any;
}
declare var ui: any;
interface RedScriptCheckResponse {
    isScript: boolean;
    quoteType?: string;
    newLine?: string;
}
declare abstract class RedTranslatorEngineWrapper {
    protected translatorEngine: TranslatorEngine;
    protected urls: Array<string>;
    protected urlUsage: Array<number>;
    protected urlScore: Array<number>;
    protected allowTranslation: boolean;
    protected paused: boolean;
    protected waiting: Array<Function>;
    protected translationCache: {
        [text: string]: string;
    };
    getEngine(): TranslatorEngine;
    abort(): void;
    pause(): void;
    resume(reset?: boolean): void;
    isCaching(): boolean;
    isKeepingScripts(): boolean;
    isMergingSymbols(): boolean;
    abstract doTranslate(text: Array<string>, options: TranslatorEngineOptions): Promise<TranslatorEngineResults>;
    private cacheHits;
    hasCache(text: string): boolean;
    getCache(text: string): string;
    setCache(text: string, translation: string): void;
    getCacheHits(): number;
    breakRow(text: string): Array<string>;
    isScript(brokenRow: Array<string>): RedScriptCheckResponse;
    curateRow(row: string): Array<RedStringEscaper>;
    translate(text: Array<string>, options: any): void;
    isValidHttpUrl(urlString: string): boolean;
    constructor(thisAddon: any, extraOptions: {
        [id: string]: any;
    }, extraSchema: {
        [id: string]: TranslationEngineOptionSchema<any>;
    }, extraForm: Array<TranslationEngineOptionFormUpdater>);
}
declare class RedSugoiEngine extends RedTranslatorEngineWrapper {
    getUrl(): string;
    reduceScore(url: string): void;
    updateUrls(): void;
    getUrlCount(): number;
    freeUrl(url: string): void;
    resetScores(): void;
    doTranslate(rows: string[], options: TranslatorEngineOptions): Promise<TranslatorEngineResults>;
    constructor(thisAddon: any);
}
declare var thisAddon: any;
declare let wrappers: RedSugoiEngine[];
declare var trans: any;
declare class RedDeepLEngine extends RedTranslatorEngineWrapper {
    constructor(thisAddon: any);
    getUrl(): string;
    freeUrl(url: string): void;
    resetScores(): void;
    doTranslate(text: string[], options: TranslatorEngineOptions): Promise<TranslatorEngineResults>;
}
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
