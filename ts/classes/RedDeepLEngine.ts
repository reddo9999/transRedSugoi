/// <reference path="RedTranslatorEngine.ts" />
/* class RedDeepLEngine extends RedTranslatorEngineWrapper {
    constructor (thisAddon : any) {
        super(thisAddon,
            {
                id: "redsugoi",
                name: "Red Sugoi Translator",
                targetUrl:"http://localhost:14366/",
                languages:{
                    "en": "English",
                    "ja": "Japanese"
                },
                description:thisAddon.package.description,
                batchDelay:1,
                skipReferencePair:true,
                lineDelimiter: "<br>",
                mode: "rowByRow",
                maxRequestLength : Number.MAX_VALUE,
            }
            ,
            {
                "targetUrl": {
                    "type": "string",
                    "title": "Target URL(s)",
                    "description": "Sugoi Translator target URL. If you have multiple servers, you can put one in each line. IMPORTANT: This is not updated by the default Sugoi Translator plugin! You need to set it up separatedly!",
                    "default":"http://localhost:14366/",
                    "required":true
                },
                "maxParallelJob": {
                    "type": "number",
                    "title": "Max Parallel job",
                    "description": "The amount of requests which will be sent simultaneously. Due to the small latency between sending a request and receiving a response, you'll usually want at least 5 requests per server so that you don't leave resources idling. Bigger numbers are also fine, but there are diminishing returns and you will lose Cache benefits if the number is too large. Recommended values are 5 to 10 per server (so if you have two servers, ideal number would be between 10 and 20). Remember, the goal is to not have anything idle, but you also don't want to overwhelm your servers to the point they start underperforming.",
                    "default":5,
                    "required":true
                },
            },
            [
                {
                    "key": "targetUrl",
                    "type": "textarea",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      var urls = value.replaceAll("\r", "").split("\n");
                      var validUrls = [];
                      for (var i in urls) {
                          if (!this.isValidHttpUrl(urls[i])) continue;
                          validUrls.push(urls[i]);
                      }
                      this.translatorEngine.update("targetUrl", validUrls.join("\n"));
                      $(<HTMLInputElement> evt.target).val(validUrls.join("\n"));
                    }
                },
                {
                    "type": "actions",
                    "title" : "Local Server Manager",
                    "fieldHtmlClass": "actionButtonSet",
                    "items": [
                      {
                        "type": "button",
                        "title": "Open server manager",
                        "onClick" : function() {
                            try {
                                trans.sugoitrans.openServerManager()
                            } catch (e) {
                                alert("This requires an up-to-date Sugoi Translator addon by Dreamsavior, it's just a shortcut. Sorry, little one.");
                            }
                        }
                      }
            
                    ]
                },
                {
                    "key": "maxParallelJob",
                    "onChange": (evt : Event) => {
                      var value = <string> $(<HTMLInputElement> evt.target).val();
                      this.translatorEngine.update("maxParallelJob", parseInt(value));
                    }
                },
            ]);
    }
} */