$(document).ready(function () {
    var $body = $("body");
    var cookie_lifetime = 365 * 5;
    var save = "trickychaos";
    
    chrome.runtime.onMessage.addListener(function (data) {
        if (data.msg == 'toggle_tricky_chaos') $body.trigger("toggle_display_mode");
    });

    $(document).keydown(function (e) {
        if (e.which != 113)
            return;
        $body.trigger("toggle_display_mode");

    });

    function toggle_display_mode() {
        if ($body.hasClass(window.feature_name))
            disable();
        else
            enable();
    }

    function enable() {
        window.trickychaos_enabled = true;
        $body.addClass(window.feature_name);
        $.cookie(save, true, { expires: cookie_lifetime });

        window.enable_handlers.forEach(handler => {
            handler();
        });
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
        window.trickychaos_enabled = false;
        $body.removeClass(window.feature_name);
        $.cookie(save, null);
        window.disable_handlers.forEach(handler => {
            handler();
        });
        // chrome.browserAction.setIcon({
        //     imageData : {
        //         "16": "icons/16_on.png",
        //         "32": "icons/32_on.png",
        //         "48": "icons/48_on.png",
        //         "128": "icons/128_on.png"
        //     }
        // });
    }




    $body.on("toggle_display_mode", toggle_display_mode);
    $body.on("enable", enable);
    $body.on("disable", disable);

});