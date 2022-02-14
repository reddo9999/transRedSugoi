/// <reference path="classes/RedSugoiEngine.ts" />
/// <reference path="classes/RedGoogleEngine.ts" />
/// <reference path="classes/RedPiggybackEngine.ts" />

var thisAddon = <any> this;
let wrappers = [
	new RedSugoiEngine(thisAddon),
	new RedGoogleEngine(thisAddon),
	//new RedPiggybackEngine(thisAddon), // We're not ready for this.
];

declare var trans : any;

wrappers.forEach(wrapper => {
	trans[wrapper.getEngine().id] = wrapper.getEngine();
});

$(document).ready(() => {
	wrappers.forEach(wrapper => {
		wrapper.getEngine().init();
	});
});