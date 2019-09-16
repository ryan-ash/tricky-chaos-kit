$(document).ready(function() {
    var $body = $("body");
    var feature_name = "trello-addons"
    var overlay_markup = `
        <a class="icon-lg tc-add-checklist" href="#"></a>
    `;
    var enabled = false;


    // === main ===

    if ($.cookie(feature_name)) {
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

        setTimeout(function() {
            check_window_addons();
        }, 100);

        $body.addClass(feature_name);
        $.cookie(feature_name, true);
    }

    function check_window_addons()
    {
        if (enabled) {
            setTimeout(function() {
                check_window_addons();
            }, 100);
        }

        $target = $(".window-wrapper");
        if (!$target.length) {
            return;
        }

        $addon = $(".tc-add-checklist");
        if ($addon.length) {
            return;
        }

        $target.append(overlay_markup);
        add_button_events();
    }

    function disable() {
        $target = $(".window-wrapper");
        $target.find(".tc-add-checklist").remove();
        enabled = false;

        $body.removeClass(feature_name);
        $.removeCookie(feature_name);
    }

    function add_button_events() {
        $(".tc-add-checklist").click(function(e){
            e.preventDefault();
            result = $(".js-add-checklist-menu")[0].click();
        });
    }
});