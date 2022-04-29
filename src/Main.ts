var thisAddon = <Addon>(<unknown>this);
const thisPath = thisAddon.getPathRelativeToRoot();
const moduleAlias = require('module-alias');
moduleAlias.addAliases({
	'@redsugoi': thisPath + '/node_modules',
	'@redengine': thisPath + '/lib/TranslationEngine'
});
moduleAlias.addPath(thisPath + '/node_modules');
moduleAlias.addPath(thisPath + '/lib/TranslationEngine');
moduleAlias(thisPath + '/package.json');

const { TextProcessor } = require('@redsugoi/mtl-text-processor');
const { TranslationEngineWrapper } = require('@redengine/TranslationEngineWrapper');
const { RedSugoiEngine } = require('@redengine/RedSugoiEngine');
const { RedGoogleEngine } = require('@redengine/RedGoogleEngine');

let wrappers = [
	new RedSugoiEngine(TextProcessor, thisAddon),
	new RedGoogleEngine(TextProcessor, thisAddon)
];

wrappers.forEach((wrapper) => {
	trans[wrapper.getEngine().id] = wrapper.getEngine();
});

$(document).ready(() => {
	wrappers.forEach((wrapper) => {
		wrapper.init();
	});
});
