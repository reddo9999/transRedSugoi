/// <reference path="RedTranslatorEngine.ts" />

function getCarryTitleMap (array? : boolean) : Array<string> | {[id : string] : string} {
    if (array) {
        return [...trans.translator];
    }
    let titleMap : {[id : string] : string} = {};
    for (let i = 0; i < trans.translator.length; i++) {
        let id = trans.translator[i];
        try {
            if (trans[id] != undefined) {
                titleMap[trans[id].id] = trans[id].name;
            }
        } catch (e) {}
    }
    return titleMap;
}

class RedPiggybackEngine extends RedTranslatorEngineWrapper {
    private lastRequest : number = 0;
    private delayed : Array<Function> = [];
    

    public delay (callback : Function, engineDelay : number) {
        let now = (new Date()).getTime();
        let timeDelta = now - this.lastRequest;
        if (timeDelta >= engineDelay) {
            this.lastRequest = now;
            callback();
        } else {
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

    public abort () {
        this.allowTranslation = false;
        this.waiting = [];
        this.paused = false;
        this.delayed = [];
    }

    public doTranslate (toTranslate : Array<string>, options : TranslatorEngineOptions) : Promise<Array<string>> {
        let batchAction = document.createTextNode("Starting up");
        let progressCurrent = document.createTextNode("0");
        let progressTotal = document.createTextNode("/" + toTranslate.length.toString());
        this.print(
            document.createTextNode("[RedPiggyBackEngine] Current Batch: "), 
            progressCurrent, 
            progressTotal, 
            document.createTextNode(" - Current Action: "), 
            batchAction
        );
        return new Promise((resolve, reject) => {
            let targetTrans : TranslatorEngine = trans[(<any> this.getEngine()).carryId];
            if (targetTrans == undefined) {
                batchAction.nodeValue = "Ended - No valid translator";
                this.error("The selected translator (" + (<any> this.getEngine()).carryId + ") is invalid or unavailable.");
                reject("The selected Translator Engine does not exist or is not available.");
            } else {
                let newOptions = {...options};

                newOptions.onAfterLoading = (result) => {
                    batchAction.nodeValue = "Receiving Translations...";
                    if (result.translation.length != toSend.length) {
                        batchAction.nodeValue = "Ended - Translator returned invalid response";
                        this.error("[RedPiggybackEngine] Received invalid response. Sent " + toTranslate.length.toString() + " sentences and got " + result.translation.length + " back. Skipping.");
                        reject("Mismatched translations.");
                    } else {
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
                        } else {
                            batchAction.nodeValue = "Awaiting internal delay...";
                            this.delay(doAction, (<any> targetTrans).batchDelay);
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

                let maxLength = (<any> targetTrans).maxRequestLength;

                let doAction = () => {
                    let sentLength = 0;
                    toSend = [];
                    while (sending < toTranslate.length && 
                                (sentLength + toTranslate[sending].length < maxLength || sentLength == 0)
                            ) {
                        sentLength += toTranslate[sending].length;
                        toSend.push(toTranslate[sending++]);
                    }
                    if (toSend.length > 0) {
                        targetTrans.translate(
                            toSend,
                            newOptions
                        );
                    } else {
                        resolve(translations);
                    }
                }

                this.delay(doAction, (<any> targetTrans).batchDelay);
            }
        });
    }

    public resetForm () {
        (<any> this.getEngine()).optionsForm.schema.carryId.enum = getCarryTitleMap(true);
        (<any> this.getEngine()).optionsForm.sechema.carryId.enum = getCarryTitleMap(true);
        (<any> this.getEngine()).optionsForm.form.carryId.enum = getCarryTitleMap(false);
    }

    constructor (thisAddon : any) {
        super(thisAddon,
            {
                id: "redpiggyback",
                name: "Red Piggyback Translator",
                description: "Uses Red Text Processor on one of the default translators. Why write many code when few code do trick?",
                batchDelay:1,
                skipReferencePair:true,
                maxRequestLength : Number.MAX_VALUE,
                lineDelimiter: "<br>",
                mode: "rowByRow",
                carryId : 'transredsugoi',
            }
            ,
            {
                "carryId": {
                    "type": "string",
                    "title": "Translator to Use",
                    "description": "Sets which translator will be used by Piggyback.",
                    "default": "redsugoi",
                    "required":false,
                    "enum": getCarryTitleMap(true)
                  },
                "escapeAlgorithm": {
                    "type": "string",
                    "title": "Code Escaping Algorithm",
                    "description": "Escaping algorithm used for the Custom Escaper Patterns. Best one will depend on the translator being used.",
                    "default": RedPlaceholderType.tagPlaceholder,
                    "required":false,
                    // @ts-ignore shhh it's fine don't worry bb
                    "enum": RedPlaceholderTypeArray
                  },
            },
            [
                {
                  "key": "carryId",
                  "titleMap": <{[id : string] : string}> getCarryTitleMap(false),
                  "onChange": (evt : Event) => {
                    var value = $(<HTMLInputElement>evt.target).val();
                    this.translatorEngine.update("carryId", value);
                  }
                },
            ]);
    }
}