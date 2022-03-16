# Version 0.73
+ Better default Regular Expressions
+ Fix: Cut corners not detecting when escaped symbol also appers in the middle

# Version 0.72
+ Buttons in the toolbar for easy toggling of Cut Corners / Cache.

# Version 0.71
+ Better infinite loop protection
    + TODO: Infinite loops should be impossible, not prevented. Figure out how to prevent them. Maybe counting? Counting could help detect when the placeholders aren't all restored, either.
    + Issues shouldn't be expected outside of freak cases where an extracted sentence translates in just the exact way that it adds a placeholder from the parent that is being used elsewhere. In theory, this can happen in any sentence. Like "Chance of 100%" being translated as "100%chance" (%c is a valid placeholder and results in a loop). It will print these errors in the log for manual evaluation.
+ Small refactor on placeholder code

# Version 0.70
+ Fix: Letter MV placeholder can go beyond Z into special characters if there are more than 26 placeholders in the same sentence.
    + I don't know if I care enough to do the same treatment for the others. Anyway, the reason that was done was...
+ Fix: If placeholders generate broken RegExp they could break translation. Now they are escaped.

# Version 0.69
+ Fix: Possible infinite loop trap when using Invalid Placeholder Style.
+ Added a changelog.

# Version 0.68
+ Improve logic for splitting (no longer uses escaping, just creates new sentences for translation)

# Version 0.67
+ Allow splitting of sentences (works similarly to sentence detection, but does not result in a new line)

# Previous versions
+ Support for Google Translator
+ String Extraction
+ Cache
+ Red Batch Translator moved to https://github.com/reddo9999/transRedBatch