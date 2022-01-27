/// <reference path="classes/RedTranslatorEngine.ts" />

var thisAddon = <any> this;
var packageName = thisAddon.package.name;
var thisEngine = new RedTranslatorEngineWrapper(thisAddon);

declare var trans : any;
window.trans[packageName] = thisEngine.getEngine();

$(document).ready(function() {
	thisEngine.getEngine().init();
});