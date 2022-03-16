/// <reference path="classes/RedSugoiEngine.ts" />
/// <reference path="classes/RedGoogleEngine.ts" />
/// <reference path="classes/RedPiggybackEngine.ts" />
/// <reference path="classes/RedButtonManager.ts" />

var thisAddon = <any> this;
let wrappers = [
	new RedSugoiEngine(thisAddon),
	new RedGoogleEngine(thisAddon),
];

let piggy = new RedPiggybackEngine(thisAddon);

declare var trans : any;
declare var engines : any;

wrappers.forEach(wrapper => {
	trans[wrapper.getEngine().id] = wrapper.getEngine();
});

//trans[piggy.getEngine().id] = piggy.getEngine();

$(document).ready(() => {
	wrappers.forEach(wrapper => {
		wrapper.getEngine().init();
	});

	let checkedIcon = ["icon-minus-squared", "icon-ok-squared"];

	function isCornerCutting () {
		return trans.redsugoi.getOptions("splitEnds") === true && trans.redgoogles.getOptions("splitEnds") === true;
	}

	function getIcon () {
		return isCornerCutting() ? checkedIcon[1] : checkedIcon[0];
	}

	let cornerButton = new RedButtonManagerButton("cutToggle", getIcon(), "Toggle Cut Corners", () => {
		let currentState = isCornerCutting();
		trans.redsugoi.update("splitEnds", !currentState);
		trans.redgoogles.update("splitEnds", !currentState);
		cornerButton.setIcon(getIcon());
	});

	let cacheIcon = ["icon-unlink", "icon-database"]

	function isCache () {
		return trans.redsugoi.getOptions("useCache") === true && trans.redgoogles.getOptions("useCache") === true;
	}

	function getCacheIcon () {
		return isCache() ? cacheIcon[1] : cacheIcon[0];
	}

	let cacheButton = new RedButtonManagerButton("cacheToggle", getCacheIcon(), "Toggle Cache", () => {
		let currentState = isCache();
		trans.redsugoi.update("useCache", !currentState);
		trans.redgoogles.update("useCache", !currentState);
		cacheButton.setIcon(getCacheIcon());
	});

	let buttonContainer = document.body.getElementsByClassName("toolbar-content toolbar10 redToolbar")[0];
	if (buttonContainer == undefined) {
		let toolbarContainer = document.body.getElementsByClassName("toolbar mainToolbar")[0];
		buttonContainer = document.createElement("div");
		buttonContainer.className = "toolbar-content toolbar10 redToolbar";
		toolbarContainer.appendChild(buttonContainer);
	}
	
	buttonContainer.appendChild(cornerButton.getButton());
	buttonContainer.appendChild(cacheButton.getButton());
});