# Version 0.80
+ Remade from scratch to use https://www.npmjs.com/package/mtl-text-processor

# Version 0.75
+ Removes useless performance metrics from log.
    + Important metrics are condensed into a single line.
+ The placeholder recoverer has been entirely rewritten. It now keeps track of what it is doing.
    + If a sentence appears to fail recovery step, the user will be informed of it so that they can manually correct it, it desired.
    + Infinite loops are no longer possible as the replacing is done based on what was escaped in the first place. This should also make that part of the code that took 0.1 seconds become 0.001 seconds or something idk.
+ Behavior of Cut Corners has been remade. It is now possible to cut corners of any kind. By default, it will cut quotes, white-space, etc, from sentences, which is just a big gain of speed/quality.
    + It is possible to recover old Cut Corners Behavior through adding Regular Expressions for your escaped symbols, but imo that's no longer desirable nor needed.

# Version 0.74
+ Sugoi Engine now able to set specific request length. So instead of sending "35" translations per request, which might or might not blow up your RAM/VRAM depending on the size of each translation, it is now possible to set a consistent character length per request.
    + For faster translations, you want this as high as your VRAM/RAM can take it.
    + For translations that don't affect the system as much, lower numbers are fine.
    + With this change, it should be possible to consistently maintain the fastest translation speed regardless of how "lucky" you are with the text order. Also more stable (since all translations are essentially the same size).
+ The default value is very conservative, please update to something that causes your GPU to cry.

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