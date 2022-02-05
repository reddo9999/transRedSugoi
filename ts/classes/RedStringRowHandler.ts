class RedStringRowHandler {
    private originalRow : string;
    private curatedLines : Array<RedStringEscaper> = [];
    private translatableLines : Array<string> = [];
    private translatableLinesIndex : Array<number> = [];
    private translatedLines : Array<string> = [];

    constructor (row : string, wrapper : RedTranslatorEngineWrapper) {
        this.originalRow = row;
        
        this.curatedLines = wrapper.curateRow(row);

        for (let i = 0; i < this.curatedLines.length; i++) {
            let curated = this.curatedLines[i];
            let line = curated.getReplacedText();
            if (line.trim() != "") {
                if (wrapper.hasCache(line)) {
                    curated.setTranslatedText(wrapper.getCache(line));
                } else {
                    this.translatableLines.push(line);
                    this.translatableLinesIndex.push(i);
                }
            }
        }

        this.translatedLines = new Array(this.translatableLines.length);
    }

    public getOriginalRow () {
        return this.originalRow;
    }

    public getTranslatedRow () {
        let lines : Array<string> = [];
        for (let i = 0; i < this.curatedLines.length; i++) {
            lines.push(this.curatedLines[i].recoverSymbols());
        }
        return lines.join("\n");
    }

    public getTranslatableLines () {
        return [...this.translatableLines];
    }

    public insertTranslation (text : string, index : number) {
        this.translatedLines[index] = text;
    }

    public applyTranslation () {
        for (let i = 0; i < this.translatedLines.length; i++) {
            // Some of them might be undefined
            // Ideally we'd check outside, but we need to keep moving forward while translating.
            let translation = this.translatedLines[i];
            if (translation != undefined) {
                this.curatedLines[this.translatableLinesIndex[i]].setTranslatedText(translation);
            }
        }
    }

    public isDone (index : number) {
        return index >= this.translatableLines.length;
    }
}