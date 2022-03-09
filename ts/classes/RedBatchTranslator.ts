/// <reference path="RedBatchTranslator/RedBatchTranslatorButton.ts" />
/// <reference path="RedBatchTranslator/RedBatchTranslatorWindow.ts" />
/// <reference path="RedBatchTranslator/RedBatchTranslatorRow.ts" />
class RedBatchTranslator {
    private button : RedBatchTranslatorButton;
    private window : RedBatchTranslatorWindow;

    constructor () {
        this.button = new RedBatchTranslatorButton(this);
        this.window = new RedBatchTranslatorWindow(this);
    }

    public open () {
        // TODO: Make options window when I feel like it
        //this.window.open();

        let files = trans.getCheckedFiles();
        if (files.length == 0) {
            files = trans.getAllFiles();
        }

        let options = {
            translator : "redsugoi",
            destination : 1,
            blacklist : ["red"],
            ignoreTranslated : true,
            whitelist: [],
            files : files
        }
        this.translateProject(options);
    }

    public close () {
        this.window.close();
    }

    public translateProject (options : {
        translator : string,
        destination : number,
        ignoreTranslated : boolean,
        blacklist : Array<string>,
        whitelist : Array<string>,
        files : Array<string>
    }) {
        ui.showLoading();
        ui.log(`[RedBatchTranslator] Beginning translation at ${new Date()}`)


        let translatorEngine : TranslatorEngine = trans[options.translator];
        let rows : Array<RedBatchTranslatorRow> = [];

        // Iterate through rows and add them up
        for (let i = 0; i < options.files.length; i++) {
            let file = options.files[i];
            let data = trans.project.files[file].data;
            for (let i = 0; i < data.length; i++) {
                let row = new RedBatchTranslatorRow(file, i);

                // Repeating work?
                if (options.ignoreTranslated && row.isTranslated()) {
                    continue;
                }

                // Empty row?
                if (row.getValue() == undefined || row.getValue() == null || row.getValue().trim() == "") {
                    continue;
                }

                if (options.blacklist.length == 0 && options.whitelist.length == 0) {
                    // Everyone is allowed
                    rows.push(row);
                } else if (options.whitelist.length > 0) {
                    // Only if your name is on the list
                    let tags = row.getTags();
                    if (tags != undefined) {
                        for (let t = 0; t < tags.length; t++) {
                            if (options.whitelist.indexOf(tags[t]) != -1) {
                                rows.push(row);
                                break;
                            }
                        }
                    }
                } else {
                    // DISCRIMINATION ON
                    let tags = row.getTags();
                    let clear = true;
                    if (tags != undefined) {
                        for (let t = 0; t < tags.length; t++) {
                            if (options.blacklist.indexOf(tags[t]) != -1) {
                                clear = false;
                                break;
                            }
                        }
                    }
                    if (clear) rows.push(row);
                }
            }
        }

        // rows = Array of rows that need translating
        let toTranslate = [];
        for (let i = 0; i < rows.length; i++) {
            toTranslate.push(rows[i].getValue());
        }

        
        /* options = options||{};
        options.onAfterLoading = options.onAfterLoading||function() {};
        options.onError = options.onError||function() {};
        options.always = options.always||function() {}; */

        translatorEngine.translate(
            toTranslate,
            {
                onError : () => {
                    ui.error("[RedBatchTranslator] Failed to translate!");
                },
                onAfterLoading : (result : {
                    sourceText : string,
                    translationText : string,
                    source : Array<string>,
                    translation : Array<string>
                }) => {
                    ui.log(`[RedBatchTranslator] Finished translation at ${new Date()}`);
                    let batchStart = Date.now();

                    let i = 0;
                    let atOnce = 0;

                    let process = () => {
                        ui.log(`[RedBatchTranslator] Inserting into tables! ${i + 1}/${result.translation.length}`);
                        for (; i < result.translation.length; i++) {
                            rows[i].setValue(result.translation[i], options.destination);
                            if (atOnce++ > 100) {
                                setTimeout(process, 1);
                                atOnce = 0;
                                return;
                            }
                        }
                        ui.log(`[RedBatchTranslator] Done!`);
                    
                        let batchEnd = Date.now();
                        ui.log(`[RedBatchTranslator] Took ${Math.round(10 * (batchEnd - batchStart)/1000)/10} seconds.`);
                        ui.log(`[RedBatchTranslator] Finished.`);
                    };

                    process();
                },
                always : () => {
                    ui.showCloseButton();
                }
            }
        )
    }
}

trans.RedBatchTranslatorInstance = new RedBatchTranslator();