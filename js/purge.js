$(document).ready(function() {
    var $body = $("body");

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
        $.cookie(save, true);
    }

    function disable() {
        $body.removeClass(feature_name);
        $.removeCookie(save);
    }
});
