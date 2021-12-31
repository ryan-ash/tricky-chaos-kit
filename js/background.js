chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, {text: 'toggle_display_mode'});
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.event == "update_icon") {
            if (request.active) {
                chrome.browserAction.setIcon({
                    imageData : {
                        "16": "icons/16_on.png",
                        "32": "icons/32_on.png",
                        "48": "icons/48_on.png",
                        "128": "icons/128_on.png"
                    }
                });            
            } else {
                chrome.browserAction.setIcon({
                    imageData : {
                        "16": "icons/16_off.png",
                        "32": "icons/32_off.png",
                        "48": "icons/48_off.png",
                       "128": "icons/128_off.png"
                    }
                });
            }
        }
        return("display mode changed");
    }
);