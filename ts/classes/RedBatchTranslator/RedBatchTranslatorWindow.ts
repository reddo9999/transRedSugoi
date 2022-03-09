class RedBatchTranslatorWindow {
    private parent : RedBatchTranslator;
    private container = document.createElement("div");

    constructor (parent : RedBatchTranslator) {
        this.parent = parent;
        this.container.classList.add("ui-widget-overlay", "ui-front");
        this.container.style.opacity = "1";
        this.container.style.backgroundColor = "rgba(170, 170, 170, .3)";

        this.container.style.display = "flex";
        this.container.style.justifyContent = "center";
        this.container.style.alignItems = "center";

        document.addEventListener("keydown", (ev) => {
            if (this.container.parentNode == document.body && ev.key == "Escape") {
                this.parent.close();
            }
        });

        let innerWindow = document.createElement("div");
        innerWindow.style.backgroundColor = "white";
        innerWindow.style.width = "600px";
        innerWindow.style.height = "500px";
        innerWindow.style.fontSize = "1.2ex";
        this.container.appendChild(innerWindow);

        let header = document.createElement("div");
        header.style.backgroundColor = "black";
        header.style.color = "white";
        header.style.lineHeight = "30px";
        header.style.paddingLeft = "10px";
        header.innerHTML = "<h1 style='margin:0px'>Red Batch Translation</h1>";
        innerWindow.appendChild(header);

        let contents = document.createElement("div");
        contents.style.padding = "10px";
        innerWindow.appendChild(contents);

        contents.appendChild($("<h2 style='margin: 0px;'>Select Translator</h2>")[0])
        contents.appendChild($("<hr></hr>")[0]);
        contents.appendChild($(`<select><option value="redsugoi">Red Sugoi Translator</option><option value="redgoogles">Red Google Translator</option></select>`)[0]);

    }

    

    public open () {
        document.body.appendChild(this.container);
    }

    public close () {
        document.body.removeChild(this.container);
    }
}


/* <div id="dialogTranslateAll" data-tranatrr="title" class="dialog dialogTranslateAll ui-dialog-content ui-widget-content initialized" style="width: auto; min-height: 0px; max-height: none; height: 285px;">
	<h2 data-tran="">Select Translator</h2>
	<div class="translatorSelection"><select class="translatorSelector"><option value="deepl">DeepL</option><option value="sugoitrans">Sugoi Translator</option><option value="papago">Papago</option><option value="redsugoi">Red Sugoi Translator</option><option value="redgoogles">Red Google Translator</option><option value="atlas">Atlas</option><option value="babylon">Babylon</option><option value="baidu">Baidu</option><option value="bing">Bing</option><option value="excite">Excite</option><option value="google">Google</option><option value="googleCloud">Google Cloud</option><option value="kakao">Kakao</option><option value="pragma6">Pragma6</option><option value="redGoogle">Red Google</option><option value="yandexpro">yandex Pro</option></select></div>
	<div class="flex col-2">
		<div class="fieldmember sourceCol">
			<h2 data-tran="">Source column</h2>
			<label class="columnSelector"><select><option value="0">Original Text</option><option value="1">Initial</option><option value="2">Machine translation</option><option value="3">Better translation</option><option value="4">Best translation</option></select></label>
			<div class="smallInfo" data-tran="">Which column is the source text to translate for?<br>(default is key column / leftmost column).</div>
		</div>
		<div class="fieldmember">
			<h2 data-tran="">Target column</h2>
			<label class="targetCol"><select><option value="1">Initial</option><option value="2">Machine translation</option><option value="3">Better translation</option><option value="4">Best translation</option></select></label>
			<div class="smallInfo" data-tran="">Which column is the translated text put into.<br>(Can not same with source column)</div>
		</div>

	</div>

	<div class="options fieldgroup">
		<h2 data-tran="">Options</h2>
		<div class="fieldmember">
			<label><input type="checkbox" name="translateOther" class="checkbox translateOther" value="1"><span data-tran="">Also try to translate other object</span></label>
			<div class="smallInfo" data-tran="">If this option is checked then Translator++ will also try to translate other objects that you did not select that doesn't require machine translation. This is the default behavior in Translator++ version 2.3.23 or lower.</div>
		</div>
		<div class="fieldmember">
			<label><input type="checkbox" name="untranslatedOnly" class="checkbox untranslatedOnly" value="1" checked="checked"><span data-tran="">Ignore if already translated</span></label>
			<div class="smallInfo" data-tran="">If this option is checked then Translator++ will ignore any row that already has translations on its column</div>
		</div>
		<div class="fieldmember">
			<label><input type="checkbox" name="overwrite" class="checkbox overwrite" value="1" checked="checked"><span data-tran="">Overwrite cells</span></label>
			<div class="smallInfo" data-tran="">Overwrite target cells. If not checked, the cells will not be touched when not empty.</div>
		</div>
		<div class="fieldmember">
			<label><input type="checkbox" name="saveOnEachBatch" class="checkbox saveOnEachBatch" value="1"><span data-tran="">Save project on each batch.</span></label>
			<div class="smallInfo" data-tran="">Save your project on each batch completion.<br>This option is to avoid data loss when the application crashes due to running heavy tasks from the local translator application. You probably don't need this if you're running cloud based translator.</div>
		</div>
		<div class="fieldmember">
			<label><input type="checkbox" name="playSoundOnComplete" class="checkbox playSoundOnComplete" value="1" checked="checked"><span data-tran="">Play sound when completed.</span></label>
		</div>
	</div>

	<div class="options fieldgroup">
		<div class="fieldmember">
			<h2 data-tran="">Tags</h2>
			<div class="colorTagSelector"><div class="uiTags uiTagsWrapper rendered" data-mark="unknown"><input type="checkbox" value="red" class="colorTagSelector tagSelector red" title="red" name="tagSelector" style="background-color: rgb(255, 0, 0);"><input type="checkbox" value="yellow" class="colorTagSelector tagSelector yellow" title="yellow" name="tagSelector" style="background-color: rgb(255, 255, 0);"><input type="checkbox" value="green" class="colorTagSelector tagSelector green" title="green" name="tagSelector" style="background-color: rgb(0, 128, 0);"><input type="checkbox" value="blue" class="colorTagSelector tagSelector blue" title="blue" name="tagSelector" style="background-color: rgb(0, 0, 255);"><input type="checkbox" value="gold" class="colorTagSelector tagSelector gold" title="gold" name="tagSelector" style="background-color: rgb(212, 175, 55);"><input type="checkbox" value="purple" class="colorTagSelector tagSelector purple" title="purple" name="tagSelector" style="background-color: rgb(128, 0, 128);"><input type="checkbox" value="black" class="colorTagSelector tagSelector black" title="black" name="tagSelector" style="background-color: rgb(0, 0, 0);"><input type="checkbox" value="gray" class="colorTagSelector tagSelector gray" title="gray" name="tagSelector" style="background-color: rgb(128, 128, 128);"><input type="checkbox" value="white" class="colorTagSelector tagSelector white" title="white" name="tagSelector" style="background-color: rgb(255, 255, 255);"><input type="checkbox" value="silver" class="colorTagSelector tagSelector silver" title="silver" name="tagSelector" style="background-color: rgb(192, 192, 192);"><input type="checkbox" value="pink" class="colorTagSelector tagSelector pink" title="pink" name="tagSelector" style="background-color: rgb(255, 192, 203);"><input type="checkbox" value="indigo" class="colorTagSelector tagSelector indigo" title="indigo" name="tagSelector" style="background-color: rgb(75, 0, 130);"><input type="checkbox" value="aqua" class="colorTagSelector tagSelector aqua" title="aqua" name="tagSelector" style="background-color: rgb(0, 255, 255);"><input type="checkbox" value="tan" class="colorTagSelector tagSelector tan" title="tan" name="tagSelector" style="background-color: rgb(210, 180, 140);"><input type="checkbox" value="darkred" class="colorTagSelector tagSelector darkred" title="darkred" name="tagSelector" style="background-color: rgb(139, 0, 0);"><div class="actionSet">
				<label class="flex"><input type="radio" name="exportTagAction" data-mark="cross" class="actionBlacklist" value="blacklist"> <span>Do not process row with selected tag (blacklist)</span></label>
				<label class="flex"><input type="radio" name="exportTagAction" data-mark="check" class="actionWhitelist" value="whitelist"> <span>Only process row with selected tag (whitelist)</span></label>
				<label class="flex"><input type="radio" name="exportTagAction" data-mark="unknown" class="actionNone" value=""> <span>Ignore tag</span></label>
			</div><div class="fieldgroup">
		<button class="loadLastSelection">Load last selection</button>
		<button class="resetField">Reset</button>
	</div></div></div>
		</div>
	</div>
</div> */