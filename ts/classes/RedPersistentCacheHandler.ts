class RedPersistentCacheHandler {
    private fs = require("fs");
    private transId : string;
    private cache : {[key : string] : string} = {};
    private changed = false;

    public constructor (id : string) {
        this.transId = id;
    }

    public addCache (key : string, translation : string) {
        this.cache[key] = translation;
        this.changed = true;
    }

    public resetCache () {
        this.cache = {};
        this.changed = true;
    }

    public hasCache (key : string) {
        return typeof this.cache[key] != "undefined";
    }

    public getCache (key : string) {
        return this.cache[key];
    }

    public getFilename () : string {
        return `${__dirname}/data/RedCache${this.transId}.json`;
    }

    public loadCache () {
        if (this.fs.existsSync(this.getFilename())) {
            try {
                let rawdata = this.fs.readFileSync(this.getFilename());
                this.cache = JSON.parse(rawdata);
                if (typeof this.cache != "object") {
                    this.cache = {};
                }
                this.changed = false;
            } catch (e) {
                this.cache = {};
                console.error("[RedPersistentCacheHandler] Load error for cache " + this.transId + ". Resetting.", e);
            }
        } else {
            console.warn("[RedPersistentCacheHandler] No cache found for " + this.transId + ".");
        }
    }

    public saveCache () {
        if (!this.changed) {
            console.warn("[RedPersistentCacheHandler] Not saving cache as there have been no changes.");
            return;
        }
        let maxSize = trans[this.transId].getOptions().persistentCacheMaxSize * 1024 * 1024;
        let size = this.getSize(JSON.stringify(this.cache));
        for (let key in this.cache) {
            if (size > maxSize) {
                size -= this.getSize(`"${key}":"${this.cache[key]}"`); // good enough of an approximation, we're not going to mars here
                delete(this.cache[key]);
            } else {
                break;
            }
        }
        
        try {
            this.fs.writeFileSync(this.getFilename(), JSON.stringify(this.cache, null, 4));
        } catch (e) {
            console.error("[RedPersistentCacheHandler] Failed saving cache for " + this.transId + ".", e);
        }
    }

    public getSize (cache : string) {
        //return (new TextEncoder().encode(cache)).length;
        return cache.length * 2; // it was too slow, we will assume: HALF IS JAPANESE HALF IS ENGLISH SO 2 BYTES PER CHARACTER, probably still a bit pessimistic, which is good enough of an approximation
    }
}