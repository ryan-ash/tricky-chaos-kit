$(document).ready(function() {
    var $body = $("body");
    var feature_name = "text-template"
    var overlay_markup = `
        <div class="OUTER_CLASS_NAME">
            test
        </div>
    `;
    overlay_markup = overlay_markup.replace('OUTER_CLASS_NAME', get_overlay_class().substring(1));

    if ($.cookie(feature_name)) {
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
        $body.append(overlay_markup);

        $body.addClass(feature_name);
        $.cookie(feature_name, true);
    }

    function disable() {
        console.log($body.find(get_overlay_class()));
        $body.find(get_overlay_class()).remove();

        $body.removeClass(feature_name);
        $.removeCookie(feature_name);
    }

    function get_overlay_class() {
        return ".overlay-" + feature_name;
    }
});
