$(document).ready(function() {
    var $body = $("body");

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
        if ($body.hasClass(feature_name))
            disable();
        else
            enable();
    }

    function enable() {
        $body.addClass(feature_name);
        $.cookie(save, true, { expires: cookie_lifetime });
    }

    function disable() {
        $body.removeClass(feature_name);
        $.removeCookie(save);
    }
});
