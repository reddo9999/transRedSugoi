/// <reference path="classes/RedSugoiEngine.ts" />
/// <reference path="classes/RedGoogleEngine.ts" />

var thisAddon = <any> this;
let wrappers = [
	new RedSugoiEngine(thisAddon),
	//new RedGoogleEngine(thisaddon), // Totally not into making this work right now.
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