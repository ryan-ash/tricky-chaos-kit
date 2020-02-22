$(document).ready(function () {

    window.feature_name = "purge youtube-addons"

    window.enable_handlers = [check_window_addons,]
    window.disable_handlers = []
    var save = "trickychaos";

    var guide_collapsed = false;
    if ($.cookie(save)) {
        $("body").trigger("enable");
    }

    function check_window_addons() {
        if (window.trickychaos_enabled) {
            if (guide_collapsed) {
                return;
            }
            setTimeout(function () {
                check_window_addons();
            }, 100);
        }

        if ($("ytd-app").attr("is-watch-page")) {
            return;
        }
        apply_windows_addons();
    }

    function apply_windows_addons() {
        if ($("ytd-app[is-watch-page]").length > 0) {
            return;
        }
        $mini_guide = $("ytd-mini-guide-renderer");
        currently_hidden = $mini_guide.attr("hidden");
        if (!currently_hidden) {
            guide_collapsed = true;
        }
        if (!guide_collapsed) {
            $("#guide-button").click();
            guide_collapsed = true;
        }
    }
});