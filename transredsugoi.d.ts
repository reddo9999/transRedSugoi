declare var sys: any;
declare var common: any;
declare enum RedPlaceholderType {
    poleposition = "poleposition",
    hexPlaceholder = "hexPlaceholder",
    noEscape = "noEscape",
    ninesOfRandomness = "closedNines"
}
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
    private allowTranslation;
    getEngine(): TranslatorEngine;
    abort(): void;
    getUrl(): string;
    freeUrl(url: string): void;
    translate(text: Array<string>, options: any): void;
    constructor(thisAddon: any);
}
declare var thisAddon: any;
declare var packageName: any;
declare function isValidHttpUrl(urlString: string): boolean;
declare var thisEngine: RedTranslatorEngineWrapper;
declare var trans: any;
