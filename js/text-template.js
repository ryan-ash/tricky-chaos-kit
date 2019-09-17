$(document).ready(function() {
    var $body = $("body");
    var $overlay = "";
    var $form = "";
    var $titles_wrapper = "";
    var $titles = [];
    var $bottom_links_wrapper = "";
    var $bottom_links = [];

    var feature_name = "text-template"
    var overlay_markup = `
        <div class="OUTER_CLASS_NAME">
            <form class="tc-form"></form>

            <div class="tc-ex">
                <textarea class="tc-post-data"></textarea>
            </div>
            <div class="tc-footer">
                <a href="">Export</a>
                <a href="">Import</a>
            </div>
        </div>
    `;
    var form_content = `
        <div class="tc-title-wrapper"></div>
        <div class="tc-add tc-button tc-add-title">+</div><br/>
        <div class="tc-tag-selector"></div><br/>
        <div class="tc-preview-link">
            <input type="text" class="tc-preview-link-input" placeholder="Preview Link">
            <div class="tc-reset tc-button">×</div>
        </div>
        <textarea class="tc-text" placeholder"Text..."></textarea><br/>
        <div class="tc-bottom-link-wrapper"></div>
        <div class="tc-add tc-button tc-add-bottom-link">+</div><br/>
        <a href="#" class="tc-parse">Parse</a>
    `
    var title_markup = `
        <div class="tc-title">
            <input type="text" class="tc-title-input" placeholder="Title">
            <div class="tc-remove tc-button">-</div>
        </div>
    `;
    var bottom_link_markup = `
        <div class="tc-bottom-link">
            <input type="text" placeholder="http://" class="tc-bottom-link-input tc-link">
            <input type="text" placeholder="Link" class="tc-bottom-link-input tc-link-text">
            <div class="tc-remove tc-button">-</div>
        </div>
    `;

    var last_title_id = 0;
    var last_bottom_link_id = 0;

    // === data ===

    var data = {
        titles: [
            "Author",
            "Title"
        ],
        tags: [

        ],
        preview_link: "https://t.me/gamedevporn",
        text: "",
        bottom_links: [
            {
                link: "https://t.me/gamedevporn",
                text: "Game Dev Porn"
            }
        ]
    };



    // === main ===

    overlay_markup = overlay_markup.replace('OUTER_CLASS_NAME', get_overlay_class().substring(1));

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
        $body.append(overlay_markup);

        $body.addClass(feature_name);
        $.cookie(feature_name, true);

        build_form();

        add_button_events();
    }

    function disable() {
        $body.find(get_overlay_class()).remove();

        $body.removeClass(feature_name);
        $.removeCookie(feature_name);
    }

    function build_form() {
        $overlay = $body.find(get_overlay_class());
        $form = $overlay.find(".tc-form");
        $form.html(form_content);
        $titles_wrapper = $form.find(".tc-title-wrapper");
        $bottom_links_wrapper = $form.find(".tc-bottom-link-wrapper");

        for (var i in data.titles)
        {
            title = data.titles[i];
            add_title();
            set_title(i, title);
        }

        for (var i in data.bottom_links)
        {
            bottom_link = data.bottom_links[i];
            add_bottom_link()
            set_bottom_link(i, bottom_link);
        }

        update_preview_link(data.preview_link);
    }

    function add_button_events() {
        $form.find(".tc-add-title").click(function(e) {
            add_title();
            e.preventDefault();
        });
        $form.find(".tc-add-bottom-link").click(function(e) {
            add_bottom_link();
            e.preventDefault();
        });
        $form.find(".tc-preview-link .tc-reset").click(function(e) {
            $form.find(".tc-preview-link-input").val("");
            e.preventDefault();
        });

        // form auto-resize
        $form.find('textarea').each(function () {
            this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
        }).on('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    function get_overlay_class() {
        return ".overlay-" + feature_name;
    }

    // event code
    function add_title() {
        $titles_wrapper.append(title_markup);        
        $titles = $titles_wrapper.find(".tc-title");
        $title_instance = $($titles[$titles.length-1]);
        id = "tc-title-" + last_title_id;
        $title_instance.attr("id", id);

        $title_instance.find(".tc-remove").click(function(e){
            $(this).parent().remove();
        });
        last_title_id += 1;
    }

    function set_title(id, title) {
        $title = $($titles[id]);
        $title.find(".tc-title-input").val(title);
    }

    function update_preview_link(link) {
        $form.find(".tc-preview-link-input").val(link);
    }

    function add_tag(tag) {

    }

    function remove_tag(tag) {

    }

    function add_bottom_link() {
        $bottom_links_wrapper.append(bottom_link_markup);        
        $bottom_links = $bottom_links_wrapper.find(".tc-bottom-link");
        $bottom_link_instance = $($bottom_links[$bottom_links.length-1]);
        id = "tc-bottom-link-" + last_bottom_link_id;
        $bottom_link_instance.attr("id", id);

        $bottom_link_instance.find(".tc-remove").click(function(e){
            $(this).parent().remove();
        });
        last_bottom_link_id += 1;
    }

    function set_bottom_link(id, bottom_link) {
        $bottom_link = $($bottom_links[id]);
        $bottom_link.find(".tc-link").val(bottom_link.link);
        $bottom_link.find(".tc-link-text").val(bottom_link.text);
    }

    function update_text(text) {

    }

});
