class RedBatchTranslatorRow {
    private location : Array<string | number>; // ["data/Actors.json", 0]

    public constructor (file : string, index : number) {
        this.location = [file, index];
    }
    
    public getValue () {
        return trans.project.files[this.location[0]].data[this.location[1]][0];
    }

    public isTranslated () {
        let cells = trans.project.files[this.location[0]].data[this.location[1]];
        let dataLength = cells.length;
        for (let i = 1; i < dataLength; i++) {
            if (cells[i] != null && cells[i] != undefined && cells[i].trim() != "") {
                return true;
            }
        }
        return false;
    }

    public setValue (text : string, destination : number) {
        trans.project.files[this.location[0]].data[this.location[1]][destination] = text;
    }

    public getTags () {
        // trans.project.files["data/Armors.json"].tags[i]
        let tags = trans.project.files[this.location[0]].tags[this.location[1]];
        if (tags == undefined) {
            return [];
        }
        return tags;
    }
}