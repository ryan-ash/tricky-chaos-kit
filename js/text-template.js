$(document).ready(function() {
    var $body = $("body");
    var feature_name = "text-template"
    var overlay_markup = `
        <div class="OUTER_CLASS_NAME">
            <form>
                <input type="text" class="tc-title" placeholder="Title"><div class="tc-remove tc-button">-</div><br/>
                <div class="tc-add tc-button">+</div><br/>
                <div class="tc-tag-selector"></div><br/>
                <input type="text" class="tc-preview-link" placeholder="Preview Link"><div class="tc-remove tc-button">-</div><br/>
                <textarea class="tc-text" placeholder"Text..."></textarea><br/>
                <input type="text" placeholder="http://" class="tc-bottom-link tc-link"><input type="text" placeholder="Link" class="tc-bottom-link tc-link-text"><div class="tc-remove tc-button">-</div><br/>
                <div class="tc-add tc-button">+</div>
            </form>

            <div class="tc-ex">
                <textarea class="tc-post-data"></textarea>
            </div>
            <div class="tc-bottom-links">
                <a href="">Export</a>
                <a href="">Import</a>
            </div>
        </div>
    `;
    overlay_markup = overlay_markup.replace('OUTER_CLASS_NAME', get_overlay_class().substring(1));

    var data = {
        titles: [
            ""
        ],
        tags: [

        ],
        preview_link: "",
        text: "",
        bottom_links: [

        ]
    };

    // data structure

    // main
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

        // parse post contents

        add_button_events();
    }

    function disable() {
        console.log($body.find(get_overlay_class()));
        $body.find(get_overlay_class()).remove();

        $body.removeClass(feature_name);
        $.removeCookie(feature_name);
    }

    function add_button_events() {

    }

    function get_overlay_class() {
        return ".overlay-" + feature_name;
    }

    // event code
    function add_title() {

    }

    function update_title(title) {

    }

    function remove_title(title) {

    }

    function update_preview_link(link) {
        
    }

    function add_tag(tag) {

    }

    function remove_tag(tag) {

    }

    function add_bottom_link(url, text) {

    }

    function remove_bottom_link(url) {

    }

    function update_text(text) {

    }

});
