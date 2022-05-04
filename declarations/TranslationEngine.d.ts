declare type TranslationEngineOptionSchema<Type> = {
    type : typeof Type;
    title? : string;
    description? : string;
    default : Type;
    required? : boolean;
    enum? : any;
}

declare type TranslationEngineOptionFormUpdater = {
    key? : string;
    title? : string;
    fieldHtmlClass? : string;
    inlinetitle? : string;
    type? : string;
    titleMap? : {[id : string] : string};
    onChange? : function;
    items? : {[id : string] : any};
}

declare type TranslationEngineOptionForm = {
    schema : {[id : string] : TranslationEngineOptionSchema};
    form : Array<TranslationEngineOptionFormUpdater>;
}

declare type TranslatorEngineOptions = {
    onAfterLoading : (result : any) => any | Promise<any>;
    onError : (reason : any) => any | Promise<any>;
    always : () => any | Promise<any>;
    progress : (perc : number) => void;
    sl : string;
    tl : string;
}

declare type TranslatorEngineResults = {
    sourceText : string;
    translationText : string;
    source : Array<string>;
    translation : Array<string | undefined>;
}

declare type TranslationEngineOptions = {
    id? : string;
    name? : string;
    author : string;
    version : string;
    description? : string;
    batchDelay? : number;
    skipReferencePair? : boolean;
    lineDelimiter? : string;
    mode? : string;
    targetUrl? : string;
    languages? : {[id : string] : string};
    optionsForm : TranslationEngineOptionForm;
}

declare class TranslatorEngine {
    constructor(options : any);
    update(id : string, value : any);
    optionsForm : TranslationEngineOptionForm;
    init() : void;
    on (
        eventType : string, 
        listener : (evt : Event, obj : {key : string, value : any}) => void
    ) : void;
    escapeCharacter (sentence : string);
    escapeLineBreak (text : string);
    id : string;
    fixTranslationFormatting (text : string);
    getOptions (...args : any[]) : any;
    loadOptions () : void;
    mergeOptionsForm (optionsForm : TranslationEngineOptionForm) : void;
    // TODO: Find what options : any is
    preProcessText (text : string, options : any);
    replacer (match, p1, p2, p3, offset, string) : string;
    replacerS (match, p1, p2, p3, offset, string) : string;
    maxRequestLength : number;
    batchDelay : number;

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
    abortTranslation () : void;
    pause () : void;
    resume () : void;

    targetUrl : string;
    targetUrls : Array<string>;

    // Variables
    [id : string] : any;
}


declare type Addon = {
    package : {
        name : string,
        author : {
            name : string
        },
        version : string,
        description : string,
    };
    getPathRelativeToRoot : () => string;
}

declare var trans : {
    [id : string] : TranslatorEngine;
    getSl () : string;
    getTl () : string;
};

declare var common : {
    fetch : (...args : any) => any
}

declare var ui : any;