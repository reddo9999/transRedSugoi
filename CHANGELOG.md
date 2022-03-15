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