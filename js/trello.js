$(document).ready(function() {
    var $body = $("body");
    var purge = "purge";

    $(document).keypress(function(e) {
        if (e.which != 96)
            return;
        toggle_display_mode();
    });

    function toggle_display_mode() {
        if ($body.hasClass(purge))
            $body.removeClass(purge);
        else
            $body.addClass(purge);
    }
});