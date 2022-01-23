/// <reference path="classes/RedTranslatorEngine.ts" />

var thisAddon = <any> this;
var packageName = thisAddon.package.name;

function isValidHttpUrl(urlString : string) {
	let url;
	try {
	  url = new URL(urlString);
	} catch (_) {
	  return false;  
	}
  
	return url.protocol === "http:" || url.protocol === "https:";
}

var thisEngine = new RedTranslatorEngineWrapper(thisAddon);

declare var trans : any;

window.trans[packageName] = thisEngine.getEngine();

$(document).ready(function() {
	thisEngine.getEngine().init();
});