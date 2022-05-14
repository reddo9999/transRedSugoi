export enum TextProcessorOrderType {
	ESCAPE_SYMBOLS,
	ISOLATE_SENTENCES,
	CUT_CORNERS,
	AGGRESSIVE_SPLITTING,
	BREAK_LINES
}

export enum PlaceholderType {
	poleposition = 'poleposition',
	hexPlaceholder = 'hexPlaceholder',
	ninesOfRandomness = 'ninesOfRandomness',
	tagPlaceholder = 'tagPlaceholder',
	tagPlaceholderLetter = 'tagPlaceholderLetter',
	closedTagPlaceholder = 'closedTagPlaceholder',
	fullTagPlaceholder = 'fullTagPlaceholder',
	curlie = 'curlie',
	doubleCurlie = 'doubleCurlie',
	curlieLetter = 'curlieLetter',
	doubleCurlieLetter = 'doubleCurlieLetter',
	privateUse = 'privateUse',
	hashtag = 'hashtag',
	hashtagTriple = 'hashtagTriple',
	tournament = 'tournament',
	mvStyle = 'mvStyle',
	wolfStyle = 'wolfStyle',
	percentage = 'percentage',
	mvStyleLetter = 'mvStyleLetter',
	wolfStyleLetter = 'wolfStyleLetter',
	sugoiTranslatorSpecial = 'sugoiTranslatorSpecial',
	sugoiTranslatorSpecial2 = 'sugoiTranslatorSpecial2'
}

export enum PlaceholderTypeNames {
	poleposition = 'Poleposition (e.g. #24)',
	hexPlaceholder = 'Hex Placeholder (e.g. 0xffffff)',
	ninesOfRandomness = 'Closed Nines (e.g. 9123412349)',
	tagPlaceholder = 'Tag Placeholder (e.g. &lt;24&gt;)',
	tagPlaceholderLetter = 'Tag Placeholder with Letters (e.g. &lt;A&gt;',
	closedTagPlaceholder = 'Tag Placeholder Closed Tags (e.g. &lt;24/&gt;)',
	fullTagPlaceholder = 'Tag Placeholder Full XML-style Tag (e.g. &lt;24&gt;&lt;/24&gt;)',
	curlie = 'Curlies (e.g. &#10100;1&#10101;)',
	doubleCurlie = 'Double Curlies (e.g. &#10100;&#10100;1&#10101;&#10101;)',
	curlieLetter = 'Curlies (e.g. &#10100;A&#10101;)',
	doubleCurlieLetter = 'Double Curlies (e.g. &#10100;&#10100;A&#10101;&#10101;)',
	privateUse = 'Supplementary Private Use Area-A (👽)',
	hashtag = 'Hashtag (#A)',
	hashtagTriple = 'Triple Hashtag (#ABC)',
	tournament = 'Tournament (e.g. #1, #2, #3)',
	mvStyle = 'MV Message (e.g. %1, %2, %3)',
	wolfStyle = 'Wolf Message (e.g. @1, @2, @3)',
	percentage = 'Actual Percentage (e.g. 1%, 2%)',
	mvStyleLetter = 'MV Message but with Letters (e.g. %A, %B, %C)',
	wolfStyleLetter = 'Wolf Message but with letters (e.g. @A, @B, @C)',
	sugoiTranslatorSpecial = "ivdos' Special (e.g. @#1, @#2)",
	sugoiTranslatorSpecial2 = "ivdos' Special with Letters (e.g. @#A, @#B)"
}

// ´`
// `´
const isolationGroups = [
	['（', '（）'],
	['〔', '〕'],
	['〖', '〗'],
	['〘', '〙'],
	['〚', '〛'],
	['｢', '｣'],
	['「', '」'],
	['〈', '〉'],
	['『', '』'],
	['【', '】'],
	['［', '］'],
	['《', '》'],
	['{', '}'],
	['〝', '〞'],
	['〞', '〝'],
	['＜', '＞'],
	['<', '>'],
	['｛', '｝'],
	['｟', '｠'],
	['〝', '〟'],
	['〟', '〟'],
	["'", "'"],
	['“', '”'],
	['⟨', '⟩'],
	['〈', '〉'],
	['`', '`'],
	['´', '´'],
	['"', '"']
];

export let isolationGroupsRegExp: string[] = [];

isolationGroups.forEach((group) => {
	isolationGroupsRegExp.push(
		new RegExp(
			`\\\\?${group[0]}[^${group[0]}${group[1]}]+?\\\\?${group[1]}`,
			'g'
		).toString() + ','
	);
});
