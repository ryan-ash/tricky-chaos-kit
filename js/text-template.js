$(document).ready(function() {
    var $body = $("body");
    var $overlay = "";
    var $form = "";
    var $titles_wrapper = "";
    var $titles = [];
    var $bottom_links_wrapper = "";
    var $bottom_links = [];

    var save = "trickychaos";
    var auto_save = "tc-auto-save";
    var feature_name = "text-template";

    var overlay_markup = `
        <div class="OUTER_CLASS_NAME">
            <form class="tc-form"></form>

            <div class="tc-ex">
                <textarea class="tc-post-data"></textarea>
            </div>
            <div class="tc-footer tc-disabled">
                <a href="">Export</a>
                <a href="">Import</a>
            </div>
        </div>
    `;

    var form_content = `
        <div class="tc-title-wrapper"></div>
        <div class="tc-add tc-button tc-add-title">+</div><br/>
        <div class="tc-tag-selector tc-wide-input">
            <input type="text" class="tc-tag-selector-input" placeholder="#tags">
            <div class="tc-reset tc-button">×</div>
        </div>
        <div class="tc-preview-link tc-wide-input">
            <input type="text" class="tc-preview-link-input" placeholder="Preview Link">
            <div class="tc-reset tc-button">×</div>
        </div>
        <textarea class="tc-text" placeholder"Text..."></textarea><br/>
        <div class="tc-bottom-link-wrapper"></div>
        <div class="tc-add tc-button tc-add-bottom-link">+</div><br/>
        <div class="tc-ps-text tc-wide-input">
            <input type="text" class="tc-ps-text-input" placeholder="PS">
            <div class="tc-reset tc-button">×</div>
        </div>
        <a href="#" class="tc-parse">Parse</a>
    `;

    var title_markup = `
        <div class="tc-title tc-wide-input">
            <input type="text" class="tc-title-input" placeholder="Title">
            <div class="tc-remove tc-button">-</div>
        </div>
    `;

    var bottom_link_markup = `
        <div class="tc-bottom-link">
            <input type="text" placeholder="http://" class="tc-bottom-link-input tc-link">
            <input type="text" placeholder="Link Text" class="tc-bottom-link-input tc-link-text">
            <div class="tc-remove tc-button">-</div>
        </div>
    `;

    var last_title_id = 0;
    var last_bottom_link_id = 0;

    var handlers_active = false;

    // === data ===

    var data = {
        titles: [
            ""
        ],
        tags: [

        ],
        preview_link: "",
        text: "",
        bottom_links: [

        ],
        ps: ""
    };

    var current_post = "";



    // === main ===

    overlay_markup = overlay_markup.replace('OUTER_CLASS_NAME', get_overlay_class().substring(1));

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
        $newpost = $body.find(".newpost");
        if (!$newpost.length) {
            setTimeout(function() {
                enable();
            }, 100);
            return;
        }
        $newpost.prepend(overlay_markup);

        $body.addClass(feature_name);
        $.cookie(save, true);

        if ($.cookie(auto_save)) {
            current_post = JSON.parse($.cookie(auto_save));
        } else {
            current_post = data;
        }

        build_form();
        add_handlers();
    }

    function disable() {
        $body.find(get_overlay_class()).remove();

        $body.removeClass(feature_name);
        $.removeCookie(save);

        handlers_active = false;
    }

    function build_form() {
        $overlay = $body.find(get_overlay_class());
        $form = $overlay.find(".tc-form");
        $form.html(form_content);
        $titles_wrapper = $form.find(".tc-title-wrapper");
        $bottom_links_wrapper = $form.find(".tc-bottom-link-wrapper");

        for (var i in current_post.titles)
        {
            title = current_post.titles[i];
            add_title();
            set_title(i, title);
        }

        update_tags(current_post.tags);
        update_preview_link(current_post.preview_link);
        update_text(current_post.text);

        for (var i in current_post.bottom_links)
        {
            bottom_link = current_post.bottom_links[i];
            add_bottom_link()
            set_bottom_link(i, bottom_link);
        }

        update_ps(current_post.ps);
    }

    function add_handlers() {
        handlers_active = true;

        $form.find(".tc-add-title").click(function(e) {
            add_title();
            e.preventDefault();
        });
        $form.find(".tc-tag-selector .tc-reset").click(function(e) {
            $form.find(".tc-tag-selector-input").val("");
            e.preventDefault();
        });
        $form.find(".tc-preview-link .tc-reset").click(function(e) {
            $form.find(".tc-preview-link-input").val("");
            e.preventDefault();
        });
        $form.find(".tc-ps-text .tc-reset").click(function(e) {
            $form.find(".tc-ps-text-input").val("");
            e.preventDefault();
        });
        $form.find(".tc-add-bottom-link").click(function(e) {
            add_bottom_link();
            e.preventDefault();
        });
        $form.find(".tc-parse").click(function(e) {
            parse_post();
            e.preventDefault();
        });

        // form auto-resize
        $form.find('textarea').each(function () {
            this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
        }).on('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        $tags = $(".tc-tag-selector");

        $form.find(".tc-tag-selector-input, .tc-preview-link-input, .tc-text, .tc-ps-text").change(function() {
            parse_post(true);
        });

        // todo: smart tag picker
        // on tags focus: show tag hint
        // tag hint:
        // - each tag is a toggle button
        // - comments are visible
        // - edit button on top
        // - show recent tags scroll
        // on edit button:
        // - hide tags
        // - show textarea with hint
        // - show accept / reject buttons
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

        $title_instance.find(".tc-remove").click(function(e) {
            $(this).parent().remove();
            parse_post(true);
        });
        $title_instance.find(".tc-title-input").change(function() {
            parse_post(true);
        });
        last_title_id += 1;
    }

    function set_title(id, title) {
        $title = $($titles[id]);
        $title.find(".tc-title-input").val(title);
    }

    function update_tags(tags) {
        if (!tags)
            return;
        tags_string = tags.join(" ");
        $form.find(".tc-tag-selector-input").val(tags_string);
    }

    function update_preview_link(link) {
        $form.find(".tc-preview-link-input").val(link);
    }

    function update_text(text) {
        $form.find(".tc-text").val(text);
    }

    function update_ps(ps) {
        $form.find(".tc-ps-text-input").val(ps);
    }

    function add_bottom_link() {
        $bottom_links_wrapper.append(bottom_link_markup);
        $bottom_links = $bottom_links_wrapper.find(".tc-bottom-link");
        $bottom_link_instance = $($bottom_links[$bottom_links.length-1]);
        id = "tc-bottom-link-" + last_bottom_link_id;
        $bottom_link_instance.attr("id", id);

        $bottom_link_instance.find(".tc-remove").click(function(e){
            $(this).parent().remove();
            parse_post(true);
        });
        $bottom_link_instance.find(".tc-bottom-link-input").change(function() {
            parse_post(true);
        });
        last_bottom_link_id += 1;
    }

    function set_bottom_link(id, bottom_link) {
        $bottom_link = $($bottom_links[id]);
        $bottom_link.find(".tc-link").val(bottom_link.link);
        $bottom_link.find(".tc-link-text").val(bottom_link.text);
    }

    function parse_post(data_run = false) {
        if (data_run) {
            if (!handlers_active)
                return;
            post = data;
        } else {
            post = "";
        }
        
        $titles = $titles_wrapper.find(".tc-title");
        $tags = $form.find(".tc-tag-selector-input");
        $preview = $form.find(".tc-preview-link-input");
        $text = $form.find(".tc-text");
        $bottom_links = $bottom_links_wrapper.find(".tc-bottom-link");
        $ps = $form.find(".tc-ps-text-input");

        tags = $tags.val().trim();
        preview = $preview.val().trim();
        text = $text.val().trim();
        ps = $ps.val().trim();

        title_present = false;
        tags_present = tags != "";
        preview_present = preview != "";
        text_present = text != "";
        ps_present = ps != "";

        $.each($titles, function(index, value) {
            $title = $(value).find(".tc-title-input");
            title = $title.val().trim();
            if (title == "")
                return;
                
            title_present = true;
            if (data_run) {
                post.titles.push(title);
            } else {
                post += "[<b>" + title + "</b>]\n";
            }
        });
        
        if (tags_present) {
            if (data_run) {
                post.tags = tags.split(" ");
            } else {
                post += "[" + tags + "]";
            }
        }

        if (preview_present) {
            if (data_run) {
                post.preview_link = preview;
            } else {
                preview_link_string = "<a href=\"" + preview + "\">&#8291;</a>";
                post += preview_link_string;
            }
        }
        
        if (tags_present && !data_run) {
            post += "\n";
        }

        if (text_present) {
            if (data_run) {
                post.text = text;
            } else {
                if (title_present || tags_present) {
                    post += "\n";
                }
                post += text;
            }
        }

        $.each($bottom_links, function(index, value) {
            $link = $(value);
            link_url = $link.find(".tc-link").val().trim();
            link_text = $link.find(".tc-link-text").val().trim();
            if (link_url == "" && link_text == "")
                return;
                
            if (data_run) {
                post.bottom_links.push({link: link_url, text: link_text});
            } else {
                if (index == 0) {
                    post += "\n\n";
                } else if (index > 0) {
                    post += " | ";
                }
                post += "<a href=\"" + link_url + "\">" + link_text + "</a>";
            }
        });

        if (ps_present) {
            if (data_run) {
                post.ps = ps;
            } else {
                post += "\n\n";
                post += "&gt; <code>" + ps + "</code>";
            }
        }

        if (data_run) {
            save_draft(post);
        } else {
            post = "<p>" + post.trim().replace(/\n/g, "</p><p>") + "</p>";

            $message_box = $(".ql-editor");
            $message_box.html(post);
        }
    }

    function save_draft(post_data) {
        current_post = post_data;
        $.cookie(auto_save, JSON.stringify(current_post));
    }
});
