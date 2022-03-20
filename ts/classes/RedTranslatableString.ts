class RedTranslatableString {
    private index : number;
    private text : string;

    constructor (index : number, text : string) {
        this.text = text;
        this.index = index;
    }

    public setText (text : string) {
        this.text = text;
    }

    public getIndex () {
        return this.index;
    }

    public getText () {
        return this.text;
    }

    public getLength () {
        return this.text.length;
    }
}