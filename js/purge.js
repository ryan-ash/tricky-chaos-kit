var $body = $("body");
var $html = $("html");

var cookie_lifetime = 365 * 5;
var save = "trickychaos";
var feature_name = "purge";

if ($.cookie(save)) {
    enable();
}

$(document).keydown(function(e) {
    if (e.which != 113)
        return;
    toggle_display_mode();
});

function toggle_display_mode() {
    // if ($body.hasClass(feature_name))
    if ($html.hasClass(feature_name))
        disable();
    else
        enable();
}

function enable() {
    // $body.addClass(feature_name);
    $html.addClass(feature_name);
    $.cookie(save, true, { expires: cookie_lifetime });
    // chrome.browserAction.setIcon({
    //     imageData : {
    //         "16": "icons/16_off.png",
    //         "32": "icons/32_off.png",
    //         "48": "icons/48_off.png",
    //        "128": "icons/128_off.png"
    //     }
    // });
}

function disable() {
    // $body.removeClass(feature_name);
    $html.removeClass(feature_name);
    $.cookie(save, null);
    // chrome.browserAction.setIcon({
    //     imageData : {
    //         "16": "icons/16_on.png",
    //         "32": "icons/32_on.png",
    //         "48": "icons/48_on.png",
    //         "128": "icons/128_on.png"
    //     }
    // });
}
