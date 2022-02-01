/// <reference path="classes/RedSugoiEngine.ts" />

var thisAddon = <any> this;
let wrappers = [new RedSugoiEngine(thisAddon)];

declare var trans : any;

wrappers.forEach(wrapper => {
	trans[wrapper.getEngine().id] = wrapper.getEngine();
});

$(document).ready(() => {
	wrappers.forEach(wrapper => {
		wrapper.getEngine().init();
	});
});