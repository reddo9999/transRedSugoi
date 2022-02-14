/// <reference path="RedTranslatorEngine.ts" />

class RedPiggybackEngine extends RedTranslatorEngineWrapper {


    public doTranslate (toTranslate : Array<string>, options : TranslatorEngineOptions) : Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            let targetTrans : TranslatorEngine = trans[(<any> this.getEngine()).carryId];
            if (targetTrans == undefined) {
                reject("The selected Translator Engine does not exist or is not available.");
            } else {
                let newOptions = {...options};
                newOptions.onAfterLoading = (result) => {
                    if (result.translation.length != toTranslate.length) {
                        this.error("[RedPiggybackEngine] Received invalid response. Sent " + toTranslate.length.toString() + " sentences and got " + result.translation.length + " back. Skipping.");
                        reject("Mismatched translations.");
                    } else {
                        resolve(result.translation);
                    }
                };

                newOptions.onError = (reason) => {
                    this.error("[RedPiggybackEngine] " + reason);
                    reject(reason);
                };

                targetTrans.translate(
                    toTranslate,
                    newOptions
                );
            }
        });
    }


    constructor (thisAddon : any) {
        super(thisAddon,
            {
                id: "redpiggyback",
                name: "Red Piggyback Translator",
                description: "Uses Red Text Processor on one of the default translators. Why write many code when few code do trick?",
                batchDelay:1,
                skipReferencePair:true,
                lineDelimiter: "<br>",
                mode: "rowByRow",
                maxParallelJob : 5,
                threads : 1,
                carryId : 'transredsugoi',
            }
            ,
            {
                "carryId": {
                    "type": "string",
                    "title": "Code Escaping Algorithm",
                    "description": "Escaping algorithm used for the Custom Escaper Patterns. For Sugoi Translator, it is recommended to use Poleposition Placeholder, which replaces symbols with a hashtag followed by a short number. MV Style and Wolf Style also appear to be somewhat consistent (MV more than Wolf style). No particular reason, they just seems to break the least.",
                    "default": "redsugoi",
                    "required":false,
                    // @ts-ignore shhh it's fine don't worry bb
                    "enum": [...trans.translator].sort()
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
                  "titleMap": escapingTitleMap,
                  "onChange": (evt : Event) => {
                    var value = $(<HTMLInputElement>evt.target).val();
                    this.translatorEngine.update("carryId", value);
                  }
                },
            ]);
    }
}