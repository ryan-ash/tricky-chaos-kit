$(document).ready(function() {
    var $body = $("body");

    var cookie_lifetime = 365 * 5;
    var save = "trickychaos";
    var feature_name = "youtube-addons"
    var enabled = false;
    var guide_collapsed = false;


    // === main ===

    if ($.cookie(save)) {
        enable();
    }

    $(document).keydown(function(e) {
        if (e.which != 113)
            return;
        toggle_display_mode();
    });



    // === functions ===

    function toggle_display_mode() {
        if ($body.hasClass(feature_name))
            disable();
        else
            enable();
    }

    function enable() {
        enabled = true;
        $body.addClass(feature_name);
        $.cookie(save, true, { expires: cookie_lifetime });

        check_window_addons();
    }

    function disable() {
        enabled = false;
        $body.removeClass(feature_name);
        $.cookie(save, null);
    }

    function check_window_addons() {
        if (enabled) {
            setTimeout(function() {
                check_window_addons();
            }, 100);
        }

        if ($("ytd-app").attr("is-watch-page")) {
            return;
        }

        apply_windows_addons();
    }

    function apply_windows_addons() {
        if (!$("ytd-mini-guide-renderer").attr("mini-guide-visible") && !guide_collapsed) {
            guide_collapsed = true;
            $("#guide-button").click();
        }
    }
});