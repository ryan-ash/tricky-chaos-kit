var $body = $("body");
var $html = $("html");

var cookie_lifetime = 365 * 5;
var save = "trickychaos";
var feature_name = "purge";

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === 'toggle_display_mode') {
        toggle_display_mode();
    }
});

$("html").addClass("tck-processed");
if ($.cookie(save)) {
    enable();
}

$(document).keydown(function(e) {
    if (e.which != 113)
        return;
    toggle_display_mode();
});

function toggle_display_mode() {
    if ($html.hasClass(feature_name))
        disable();
    else
        enable();
}

function update_icon() {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage({event: "update_icon", active: $html.hasClass(feature_name)});
    }
}

function enable() {
    $html.addClass(feature_name);
    $.cookie(save, true, { expires: cookie_lifetime });
    update_icon();
}

function disable() {
    $html.removeClass(feature_name);
    $.cookie(save, null);
    update_icon();
}

$(document).ready(function() {
    setTimeout(function() {
        $("html").addClass("tck-loaded");
    }, 250);
});

$(window).focus(function(){
    update_icon();
});