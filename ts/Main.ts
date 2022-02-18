/// <reference path="classes/RedSugoiEngine.ts" />
/// <reference path="classes/RedGoogleEngine.ts" />
/// <reference path="classes/RedPiggybackEngine.ts" />

var thisAddon = <any> this;
let wrappers = [
	new RedSugoiEngine(thisAddon),
	new RedGoogleEngine(thisAddon),
];

let piggy = new RedPiggybackEngine(thisAddon);

declare var trans : any;

wrappers.forEach(wrapper => {
	trans[wrapper.getEngine().id] = wrapper.getEngine();
});

//trans[piggy.getEngine().id] = piggy.getEngine();

$(document).ready(() => {
	wrappers.forEach(wrapper => {
		wrapper.getEngine().init();
	});

	/* piggy.getEngine().init();

	setTimeout(() => {
		piggy.resetForm();
	}, 500); */
});