$(document).ready(function () {
    chrome.browserAction.onClicked.addListener(function (tab) {
        chrome.tabs.sendMessage(tab.id, { msg: "toggle_tricky_chaos" });
    });
});