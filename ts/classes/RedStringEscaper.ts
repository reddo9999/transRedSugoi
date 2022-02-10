declare var sys : any; // System stuff I don't want to describe in detail
declare var common : any; // Utils?

enum RedPlaceholderType {
    poleposition = "poleposition",
    hexPlaceholder = "hexPlaceholder",
    noEscape = "noEscape",
    ninesOfRandomness = "ninesOfRandomness",
    tagPlaceholder = "tagPlaceholder",
    closedTagPlaceholder = "closedTagPlaceholder",
    fullTagPlaceholder = "fullTagPlaceholder",
    curlie = "curlie",
    doubleCurlie = "doubleCurlie",
    privateUse = "privateUse",
    hashtag = "hashtag",
    hashtagTriple = "hashtagTriple",
    tournament = "tournament",
    mvStyle = "mvStyle",
    wolfStyle = "wolfStyle",
}

// I wonder if we could initiate this through calling the above...
// I'd rather not have to change both
enum RedPlaceholderTypeNames {
    poleposition = "Poleposition (e.g. #24)",
    hexPlaceholder = "Hex Placeholder (e.g. 0xffffff)",
    noEscape = "No escaping (will translate everything)",
    ninesOfRandomness = "Closed Nines (e.g. 9123412349)",
    tagPlaceholder = "Tag Placeholder (e.g. &lt;24&gt;)",
    closedTagPlaceholder = "Tag Placeholder Closed Tags (e.g. &lt;24/&gt;)",
    fullTagPlaceholder = "Tag Placeholder Full XML-style Tag (e.g. &lt;24&gt;&lt;/24&gt;)",
    curlie = "Curlies (e.g. letter enclosed by curly brackets)",
    doubleCurlie = "Double Curlies (e.g. letter enclosed by two curly brackets on each side)",
    privateUse = "Supplementary Private Use Area-A (👽)",
    hashtag = "Hashtag (#A)",
    hashtagTriple = "Triple Hashtag (#ABC)",
    tournament = "Tournament (e.g. #1, #2, #3)",
    mvStyle = "MV Message (e.g. %1, %2, %3)",
    wolfStyle = "Wolf Message (e.g. @1, @2, @3)",
}

let RedPlaceholderTypeArray = [
    RedPlaceholderType.poleposition,
    RedPlaceholderType.hexPlaceholder,
    RedPlaceholderType.noEscape,
    RedPlaceholderType.ninesOfRandomness,
    RedPlaceholderType.tagPlaceholder,
    RedPlaceholderType.closedTagPlaceholder,
    RedPlaceholderType.fullTagPlaceholder,
    RedPlaceholderType.curlie,
    RedPlaceholderType.doubleCurlie,
    RedPlaceholderType.privateUse,
    RedPlaceholderType.hashtag,
    RedPlaceholderType.hashtagTriple,
    RedPlaceholderType.tournament,
    RedPlaceholderType.mvStyle,
    RedPlaceholderType.wolfStyle,
];


let regExpObj : any = {};
regExpObj[RedPlaceholderType.poleposition] = /((?:#[0-9]+){2,})/g;
regExpObj[RedPlaceholderType.mvStyle] = /((?:%[0-9]+){2,})/g;
regExpObj[RedPlaceholderType.wolfStyle] = /((?:@[0-9]+){2,})/g;
regExpObj[RedPlaceholderType.tournament] = /((?:#[0-9]+){2,})/g;
regExpObj[RedPlaceholderType.hexPlaceholder] = /((?:0x[0-9a-fA-F]+){2,})/gi;
regExpObj[RedPlaceholderType.tagPlaceholder] = /((?:<[0-9]{2,}>){2,})/g;
regExpObj[RedPlaceholderType.closedTagPlaceholder] = /((?:<[0-9]{2,}\/>){2,})/g;
regExpObj[RedPlaceholderType.ninesOfRandomness] = new RegExp("((?:9[0-9]{4,}9){2,})", "g");
regExpObj[RedPlaceholderType.fullTagPlaceholder] = /((?:<[0-9]{2,}><\/[0-9]{2,}>){2,})/g;
regExpObj[RedPlaceholderType.curlie] = /((?:{[A-Z]+}){2,})/g;
regExpObj[RedPlaceholderType.doubleCurlie] = /((?:{{[A-Z]+}){2,}})/gi;
regExpObj[RedPlaceholderType.privateUse] = /([\uF000-\uFFFF]{2,}})/g;
regExpObj[RedPlaceholderType.hashtag] = /((?:#[A-Z]){2,})/gi;
regExpObj[RedPlaceholderType.hashtagTriple] = /((?:#[A-Z][A-Z][A-Z]){2,})/gi;

let escapingTitleMap : {[id : string] : string} = RedPlaceholderTypeNames;

class RedStringEscaper {
    private text : string;
    private type : RedPlaceholderType = RedPlaceholderType.poleposition;
    private splitEnds : boolean = true;
    private removeUnks : boolean = true;
    private mergeSymbols : boolean = true;
    private symbolAffix : number = 1;
    private currentSymbol : number = 4;
    private hexCounter : number = 983041;
    private closedNinesLength : number = 7; // plus two boundaries
    private storedSymbols : {[tag : string] : string} = {};
    private reverseSymbols : {[text : string] : string} = {};
    private currentText : string;
    private broken: boolean = false;

    private curlyCount = 65; //A
    private privateCounter = 983041; // 👽

    private preString : string = "";
    private postString : string = "";

    private isScript : boolean = false;
    private quoteType : string = "";

    private hashtagOne = 65; //A
    private hashtagTwo = 66; //B
    private hashtagThree = 67; //C

	constructor (text : string, scriptCheck : RedScriptCheckResponse, type? : RedPlaceholderType, splitEnds? : boolean, mergeSymbols? : boolean, noUnks? : boolean)  {
		this.text = text;
		this.currentText = text;
        this.type = type || RedPlaceholderType.poleposition;
        this.splitEnds = splitEnds == true;
        this.removeUnks = noUnks == true;
        this.mergeSymbols = mergeSymbols == true;
        this.isScript = scriptCheck.isScript;
        if (this.isScript) {
            this.quoteType = <string> scriptCheck.quoteType;
            this.currentText = <string> scriptCheck.newLine;
        }
        this.escape();
	}

    public break () {
        this.broken = true;
    }

    public getTag () {
        return `<${this.symbolAffix++}${this.currentSymbol++}>`;
    }

    public getClosedTag () {
        return `<${this.symbolAffix++}${this.currentSymbol++}/>`;
    }

    public getFullTag () {
        let contents = `${this.symbolAffix++}${this.currentSymbol++}`
        return `<${contents}></${contents}>`;
    }

    public getPolePosition () {
        return `#${this.symbolAffix++}${this.currentSymbol++}`;
    }

    public getMvStyle () {
        return `%${this.symbolAffix++}`;
    }

    public getWolfStyle () {
        return `@${this.symbolAffix++}`;
    }

    public getHexPlaceholder () {
        return "0x" + (this.hexCounter++).toString(16);
    }

    public getCurly () {
        return "{" + String.fromCharCode(this.curlyCount++) + "}";
    }

    public getDoubleCurly () {
        return "{{" + String.fromCharCode(this.curlyCount++) + "}}";
    }

    public getClosedNines () {
        return  "9" +
        Array.from({length: this.closedNinesLength}, () => Math.floor(Math.random() * 10).toString()).join("")
        + "9";
    }

    public getPrivateArea () {
        return String.fromCodePoint(this.privateCounter++);
    }

    public getHashtag () {
        return `#${String.fromCharCode(this.hashtagOne++)}`;
    }

    public getTripleHashtag () {
        return `#${String.fromCharCode(this.hashtagOne++)}${String.fromCharCode(this.hashtagTwo++)}${String.fromCharCode(this.hashtagThree++)}`;
    }

    public getTournament () {
        return `#${this.symbolAffix++}`;
    }

    public storeSymbol (text : string) : string {
        // Originally was using tags, hence the name. Then I tried parenthesis.
        // I think the AI might get used to any tags we use and just start. ... killing them
        // So far this seems to work the best
        if (this.reverseSymbols[text] != undefined) {
            // if we reuse the same symbol it might help the AI understand the sentence
            return this.reverseSymbols[text];
        } else {
            let tag : string = "Invalid Placeholder Style";
            switch (this.type) {
                case RedPlaceholderType.poleposition:
                    tag = this.getPolePosition();
                    break;
                case RedPlaceholderType.hexPlaceholder:
                    tag = this.getHexPlaceholder();
                    break;
                case RedPlaceholderType.noEscape:
                    tag = text;
                    break;
                case RedPlaceholderType.ninesOfRandomness:
                    tag = this.getClosedNines();
                    break;
                case RedPlaceholderType.tagPlaceholder:
                    tag = this.getTag();
                    break;
                case RedPlaceholderType.fullTagPlaceholder:
                    tag = this.getFullTag();
                    break;
                case RedPlaceholderType.closedTagPlaceholder:
                    tag = this.getClosedTag();
                    break;
                case RedPlaceholderType.curlie:
                    tag = this.getCurly();
                    break;
                case RedPlaceholderType.doubleCurlie:
                    tag = this.getDoubleCurly();
                    break;
                case RedPlaceholderType.privateUse:
                    tag = this.getPrivateArea();
                    break;
                case RedPlaceholderType.hashtag:
                    tag = this.getHashtag();
                    break;
                case RedPlaceholderType.hashtagTriple:
                    tag = this.getTripleHashtag();
                    break;
                case RedPlaceholderType.tournament:
                    tag = this.getTournament();
                    break;
                case RedPlaceholderType.mvStyle:
                    tag = this.getMvStyle();
                    break;
                case RedPlaceholderType.wolfStyle:
                    tag = this.getWolfStyle();
                    break;
            }
            this.storedSymbols[tag.trim()] = text;
            this.reverseSymbols[text] = tag.trim();
            return tag;
        }
    }

    public getOriginalText () {
        return this.text;
    }

    public getReplacedText () {
        if (this.broken) {
            return "";
        }
        return this.currentText;
    }

    public setTranslatedText (text : string) {
        this.currentText = text;
    }

    public recoverSymbols () {
        if (this.broken) {
            return "";
        }
        // DEBUG
        //console.log(this.currentText, this.storedSymbols);

        // This needs to be done FIRST!!!!!!!!!!!!!!
        this.currentText = this.preString + this.currentText + this.postString;

        // This is pretty fast to do, so we iterate until we're sure we got everything *just in case*
        // Worst case scenario this will be a single unnecessary run through anyway, and this allows us to possibly end up with nested symbols
        let found = true;
        while (found) {
            //console.warn("Recover loop");
            found = false;
            for (let key in this.storedSymbols) {
                let idx = this.currentText.indexOf(key);
                while (idx != -1) {
                    found = true;
                    this.currentText =  this.currentText.substring(0, idx) +
                                        this.storedSymbols[key] +
                                        this.currentText.substring(idx + key.length);
                    idx = this.currentText.indexOf(key);
                }
            }
        }
        // Sugoi fails and adds <unk> where it doesn't understand something
        // It turns people into pigs! Pigs!
        // let's remove those
        if (this.removeUnks) {
            this.currentText = this.currentText.replaceAll("<unk>", "");
        }

        if (this.isScript) {
            this.currentText = JSON.stringify(this.currentText);
            if (this.currentText.charAt(0) != this.quoteType) {
                // escape the quotes
                this.currentText = this.currentText.replaceAll(this.quoteType, `\\${this.quoteType}`);
                this.currentText = this.quoteType + this.currentText.substring(1, this.currentText.length - 1) + this.quoteType;
            }
        }
        
        // DEBUG
        // console.log(finalString, this.storedSymbols);

        return this.currentText;
    }

    /**
     * Ideally we'd make something that works just the same as the hex placeholder, but I'm currently too drunk to analyze it
     * So I'll just make something that's hopefully similar enough to live through updates!
     */
    public escape () {
        // Are we escaping?
        if (this.type == RedPlaceholderType.noEscape) {
            this.currentText = this.text;
            return this.text;
        }
        let formulas = RedStringEscaper.getActiveFormulas();
        let text = this.currentText || this.text;
        //console.log("Formulas : ", formulas);
        for (var i=0; i<formulas.length; i++) {
            if (!Boolean(formulas[i])) continue;
            
            /**
             * Function should return a string or Array of strings
             */
            if (typeof formulas[i] == 'function') {
                //console.log(`formula ${i} is a function`);
                var arrayStrings = (<Function> formulas[i]).call(this, text);
                //console.log(`result`, arrayStrings);
                if (typeof arrayStrings == 'string') arrayStrings = [arrayStrings];
                if (Array.isArray(arrayStrings) == false) continue;

                for (var x in arrayStrings) {
                    text = text.replaceAll(arrayStrings[x], (match : string) => {
                        // Is this used for anything?
                        //var lastIndex = this.placeHolders.push(match)-1;
                        return this.storeSymbol(match);
                    });				
                }
            } else {
                //console.log("replacing....");
                text = text.replaceAll(<RegExp> formulas[i], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }

        // Just for fun, if we have symbols at the very start or the very end, don't even send them to the translator!
        // We end up missing some contextual clues that may help 
        //      (e.g. "\c[2] is annoying" would at least give them the context of "[symbol] is annoying", which could improve translations)
        //      without context information it'd probably translate to an end result of "[symbol] It is annoying" since it had no subject.
        // Safety vs Quality?
        // Results are VERY good when the symbols aren't actually part of the sentence, which escaped symbols at start or end most likely are.
        // replaceAll won't give us the exact position of what it's replacing and I don't like guessing, so instead I'll check manually.
        this.currentText = this.currentText.trim();
        let found = true;
        while (found && this.splitEnds) {
            found = false;
            for (let tag in this.storedSymbols) {
                let idx = text.indexOf(tag);
                if (idx == 0) {
                    this.preString += this.storedSymbols[tag];
                    text = text.substring(tag.length); // replace was dangerous, so we do it old school
                    found = true;
                } else if (idx != -1 && (idx + tag.length) == text.length) {
                    // Everything we find after the first one will be coming before it, not after
                    this.postString = this.storedSymbols[tag] + this.postString;
                    text = text.substring(0, idx);
                    found = true;
                }
            }
        }

        // Replace sequential occurrences of Symbols with a single symbol!
        // TESTING THIS IS HELL ON EARTH SOMEONE PLEASE TEST THIS I DON'T HAVE GOOD SENTENCES TO TEST IT
        // Theoretically, this should result in less mangling of symbols as the translator is fed less of them to begin with
        if (this.mergeSymbols) {
            if (regExpObj[this.type] != undefined) {
                text = text.replaceAll(regExpObj[this.type], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }
        
        this.currentText = text;
        //console.log("%cEscaped text", 'background: #222; color: #bada55');
        //console.log(text);
        return text;
    }

    public static cachedFormulaString = "";
    public static cachedFormulas : Array<RegExp | Function> = [];

    public static getActiveFormulas () {
        sys.config.escaperPatterns = sys.config.escaperPatterns || [];
        // Is our cache valid?
        if (RedStringEscaper.cachedFormulaString == JSON.stringify(sys.config.escaperPatterns)) {
            return RedStringEscaper.cachedFormulas;
        }
        // Update cache
        let formulas : Array<RegExp | Function> = [];
        for (var i in sys.config.escaperPatterns) {
            //console.log(`handling ${i}`, sys.config.escaperPatterns[i]);
            if (typeof sys.config.escaperPatterns[i] !== "object") continue;
            if (!sys.config.escaperPatterns[i].value) continue;
            try {
                var newReg : RegExp | Function;
                //console.log(sys.config.escaperPatterns[i].value);
                if (common.isRegExp(sys.config.escaperPatterns[i].value)) {
                    //console.log("is regex");
                    newReg = common.evalRegExpStr(sys.config.escaperPatterns[i].value);
                } else if (common.isStringFunction(sys.config.escaperPatterns[i].value)) {
                    //console.log("pattern ", i, "is function");
                    newReg = RedStringEscaper.renderFunction(sys.config.escaperPatterns[i].value);
                } else {
                    //console.log("Is string");
                    newReg = JSON.parse(sys.config.escaperPatterns[i].value);
                }
                if (newReg != undefined) {
                    formulas.push(newReg);
                }
            } catch (e){
                console.warn("[RedStringEscaper] Error Trying to render Escaper Pattern ", sys.config.escaperPatterns[i], e);
            }
        }

        // Since sugoi only translates japanese, might as well remove anything else
        //formulas.push(/(^[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf])/g);
        RedStringEscaper.cachedFormulaString = JSON.stringify(sys.config.escaperPatterns);
        RedStringEscaper.cachedFormulas = formulas;
        return formulas;
    }

    public static renderFunction (string : string) {
        try {
            var func = eval("["+string+"]");
            return func[0];
        } catch (e) {
            console.error("[TAGPLACEHOLDER] Error rendering function", e);
            return false;
        }
    }
}

(<any> window).RedStringEscaper = RedStringEscaper;