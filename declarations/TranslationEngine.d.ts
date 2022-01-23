declare interface TranslationEngineOptionSchema<Type> {
    type : typeof Type;
    title : string;
    description : string;
    default : Type;
    required? : boolean;
}

declare interface TranslationEngineOptionFormUpdater {
    key : string;
    inlinetitle? : string;
    type? : string;
    titleMap? : {[id : string] : string};
    onChange : function;
}

declare interface TranslationEngineOptionForm {
    schema : {[id : string] : TranslationEngineOptionSchema};
    form : Array<TranslationEngineOptionFormUpdater>;
}

declare interface TranslationEngineOptions {
    id : string;
    name : string;
    author : string;
    version : string;
    description : string;
    batchDelay : number;
    skipReferencePair : boolean;
    lineDelimiter : string;
    mode : string;
    targetUrl : string;
    languages : {[id : string] : string};
    optionsForm : TranslationEngineOptionForm;
}

declare class TranslatorEngine {
    constructor(options : TranslationEngineOptions);
    update(id : string, value : any);
    init() : void;
    escapeCharacter (sentence : string);
    escapeLineBreak (text : string);
    fixTranslationFormatting (text : string);
    getOptions (...args : any[]) : {[id : string] : any};
    loadOptions () : void;
    mergeOptionsForm (optionsForm : TranslationEngineOptionForm) : void;
    // TODO: Find what options : any is
    preProcessText (text : string, options : any);
    replacer (match, p1, p2, p3, offset, string) : string;
    replacerS (match, p1, p2, p3, offset, string) : string;

    /**
     * Returns the string to it's original state line-break-wise
     * @param text - the string with linebreaks replaced by something else
     */
    restoreLineBreak (text : string) : string;
    restorer (...args : Array<string>) : string;
    restorerS (...args : Array<string>) : string;

    /**
     * Saves configuration status
     */
    save() : void;
    str2Num (num) : string;
    translate (text : Array<string>, options) : void;
    unescapeCharacter (sentence) : string;

    abort () : void;

    targetUrl : string;
    targetUrls : Array<string>;
}