$(document).ready(function() {
    var $body = $("body");
    var purge = "purge";

    // TODO: finish locking on input & textarea
    var keypressLocked = false;

    $(document).keydown(function(e) {
        if (e.which != 192 || keypressLocked)
            return;
        toggle_display_mode();
    });

    // $("textarea, input").focus(function() {
    //     keypressLocked = true;
    // });

    // $("textarea, input").blur(function() {
    //     keypressLocked = false;
    // });

    function toggle_display_mode() {
        if ($body.hasClass(purge))
            $body.removeClass(purge);
        else
            $body.addClass(purge);
    }
});