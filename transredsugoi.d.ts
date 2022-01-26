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
    poleposition = "Poleposition",
    hexPlaceholder = "Hex Placeholder",
    noEscape = "No escaping",
    ninesOfRandomness = "Closed Nines",
    tagPlaceholder = "Tag Placeholder",
    closedTagPlaceholder = "Tag Placeholder (Closed Tags)",
    fullTagPlaceholder = "Tag Placeholder (Full XML-style Tag)"
}
declare let RedPlaceholderTypeArray: RedPlaceholderType[];
declare class RedStringEscaper {
    private text;
    private type;
    private splitEnds;
    private removeUnks;
    private symbolAffix;
    private currentSymbol;
    private hexCounter;
    private closedNinesLength;
    private storedSymbols;
    private reverseSymbols;
    private currentText;
    private preString;
    private postString;
    constructor(text: string, type?: RedPlaceholderType, splitEnds?: boolean, noUnks?: boolean);
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
    static cachedFormulas: Array<any>;
    static getActiveFormulas(): any[];
    static renderFunction(string: string): any;
}
declare var ui: any;
declare class RedTranslatorEngineWrapper {
    private translatorEngine;
    private urls;
    private urlUsage;
    private urlScore;
    private allowTranslation;
    private paused;
    private waiting;
    getEngine(): TranslatorEngine;
    abort(): void;
    pause(): void;
    resume(reset?: boolean): void;
    getUrl(): string;
    freeUrl(url: string): void;
    resetScores(): void;
    translate(text: Array<string>, options: any): void;
    constructor(thisAddon: any);
}
declare var thisAddon: any;
declare var packageName: any;
declare function isValidHttpUrl(urlString: string): boolean;
declare var thisEngine: RedTranslatorEngineWrapper;
declare var trans: any;
