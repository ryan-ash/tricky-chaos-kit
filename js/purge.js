$(document).ready(function() {
    var $body = $("body");
    var purge = "purge";

    if ($.cookie("purge-enabled")) {
        enable_purge();
    }

    $(document).keydown(function(e) {
        if (e.which != 113)
            return;
        toggle_display_mode();
    });

    function toggle_display_mode() {
        if ($body.hasClass(purge))
            disable_purge();
        else
            enable_purge();
    }

    function enable_purge() {
        $body.addClass(purge);
        $.cookie("purge-enabled", true);
    }

    function disable_purge() {
        $body.removeClass(purge);
        $.removeCookie("purge-enabled");
    }
});
