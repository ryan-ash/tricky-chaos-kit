$(document).ready(function() {
    var $body = $("body");
    var $newpost = "";
    var $overlay = "";
    var $tags_buttons = "";
    var $form = "";
    var $titles_wrapper = "";
    var $titles = [];
    var $bottom_links_wrapper = "";
    var $bottom_links = [];

    var cookie_lifetime = 365 * 5;
    var save = "trickychaos";
    var auto_save = "tc-auto-save";
    var drafts_save = "tc-drafts";
    var tag_save = "tc-tag-helper";
    var feature_name = "text-template";

    var last_title_id = 0;
    var last_bottom_link_id = 0;

    var handlers_active = false;
    var auto_save_inactive = false;

    // === data ===

    var data = {
        titles: [

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
    var saved_drafts = []
    var last_preview = "";

    var tag_selector_help = "Your #tag #map could be here...";
    var initial_tag_selector_help = tag_selector_help;



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

        $footer = $body.find("footer");
        $footer_name_span = $body.find("footer > span:first-child");
        $footer.css("max-width", $footer_name_span.width());

        $body.addClass(feature_name);
        $.cookie(save, true, { expires: cookie_lifetime });

        if ($.cookie(auto_save)) {
            current_post = JSON.parse($.cookie(auto_save));

            // temp fix to empty posts
            if (!current_post.titles)
            {
                current_post = copy_json(data);
            }
        } else {
            current_post = copy_json(data);
        }

        if ($.cookie(drafts_save)) {
            saved_drafts = JSON.parse($.cookie(drafts_save));
        }

        if ($.cookie(tag_save) && JSON.parse($.cookie(tag_save)) != "") {
            tag_selector_help = JSON.parse($.cookie(tag_save));
        }

        build_form();
        build_drafts();
        generate_preview();
        add_handlers();
    }

    function disable() {
        $body.find(get_overlay_class()).remove();
        $body.find(".tc-link-preview").remove();

        $body.removeClass(feature_name);
        $.cookie(save, null);

        handlers_active = false;
    }

    function build_form() {
        auto_save_inactive = true;
        $overlay = $body.find(get_overlay_class());
        $form = $overlay.find(".tc-form");
        $form.html(form_content);
        $titles_wrapper = $form.find(".tc-title-wrapper");
        $bottom_links_wrapper = $form.find(".tc-bottom-link-wrapper");

        for (var i in current_post.titles) {
            title = current_post.titles[i];
            add_title();
            set_title(i, title);
        }

        build_tag_help();
        refresh_tags_view();

        update_preview_link(current_post.preview_link);
        update_text(current_post.text);

        for (var i in current_post.bottom_links) {
            bottom_link = current_post.bottom_links[i];
            add_bottom_link()
            set_bottom_link(i, bottom_link);
        }

        update_ps(current_post.ps);

        auto_save_inactive = false;
        parse_post(true);
    }

    function build_tag_help() {
        $tag_helper = $form.find(".tc-tag-helper");
        $tag_view = $form.find(".tc-tag-view");
        $tag_helper_edit = $form.find(".tc-tag-helper-edit");

        tag_filter = /#[0-9a-zA-Z_]+/g;
        tag_selector_help_html = tag_selector_help.trim().split("\n").join("<br />");
        tag_selector_help_html = tag_selector_help_html.replace(tag_filter, "<div class='tc-tag tc-text-button tc-dynamic-width'>$&</div>")

        $tag_view.html(tag_selector_help_html);
        $tag_helper_edit.val(tag_selector_help.trim());
        resize_textarea($tag_helper_edit[0]);

        $tags_buttons = $tag_view.find(".tc-tag");

        $tags_buttons.click(function(e) {
            toggle_tag($(this));
        });

        update_tags(current_post.tags);

        // todo: tag hint build
        // - show recent tags scroll
    }

    function toggle_tag($tag) {
        set_tag($tag, !$tag.hasClass("tc-selected"));
    }

    function set_tag($tag, enable, skip_save = false) {
        if (enable) {
            $tag.addClass("tc-selected");
            if (!skip_save) {
                current_post.tags.push($tag.html());
                update_tags(current_post.tags);    
            }
        } else {
            $tag.removeClass("tc-selected");
            if (!skip_save) {
                index = current_post.tags.indexOf($tag.html());
                if (index != -1) {
                    current_post.tags.splice(index, 1);
                }
                update_tags(current_post.tags);
            }
        }
    }

    function refresh_tags_view() {
        $tags_buttons.each(function() {
            $tag = $(this);
            current_tag = $tag.html();
            set_tag($tag, current_post.tags.includes(current_tag), true);
        });
    }

    function arrayRemove(arr, value) {
        return arr.filter(function(ele){
            return ele != value;
        });
     }

    function build_drafts() {
        $select = $form.find(".tc-draft-list");
        $select.empty();
        for (var i in saved_drafts) {
            draft = saved_drafts[i];
            title_amount = draft.titles.length;
            draft_name = title_amount > 0 ? draft.titles[title_amount-1] : draft.text.substring(0, 30) + "...";
            draft_option = "<option value='" + i + "'>" + i + ": " + draft_name + "</option>";
            $(draft_option).val(i);
            $select.append(draft_option);
        }
    }

    function generate_preview() {
        embed_link = get_embed_link(current_post.preview_link);
        $wc_form = $newpost.find('.el-form');
        $sibling = $wc_form.find(".cb-textarea-wrapper");

        $wc_form.find('.tc-link-preview').remove();
        $wc_form.append(link_preview_markup);

        $instance = $wc_form.find(".tc-link-preview");
        $instance.insertAfter($sibling);

        if (embed_link == "") {
            $instance.addClass("tc-disabled");
        } else {
            $instance.removeClass("tc-disabled");
        }

        $iframe_instance = $wc_form.find(".tc-link-preview iframe");
        $iframe_instance.attr("src", embed_link);
    }

    function get_embed_link(source) {
        is_long_yt = source.search("youtube.com") != -1;
        is_short_yt = source.search("youtu.be") != -1;
        if (!is_long_yt && !is_short_yt)
            return "";

        key = "";
        if (is_long_yt) {
            key = source.substr(source.search("v=") + 2);
        } else if (is_short_yt) {
            key = source.substr(source.search(".be/") + 4);
        }
        return "https://youtube.com/embed/" + key;
    }

    function add_handlers() {
        handlers_active = true;

        $form.find(".tc-add-title").click(function(e) {
            add_title();
            e.preventDefault();
        });
        $form.find(".tc-tag-selector .tc-reset").click(function(e) {
            $form.find(".tc-tag-selector-input").val("");
            update_tags([]);
            refresh_tags_view();
            parse_post(true);
            e.preventDefault();
        });
        $form.find(".tc-preview-link .tc-reset").click(function(e) {
            $form.find(".tc-preview-link-input").val("");
            parse_post(true);
            e.preventDefault();
        });
        $form.find(".tc-ps-text .tc-reset").click(function(e) {
            $form.find(".tc-ps-text-input").val("");
            parse_post(true);
            e.preventDefault();
        });
        $form.find(".tc-text-wrapper .tc-reset").click(function(e) {
            $text = $form.find(".tc-text");
            $text.val("");
            resize_textarea($text[0]);
            parse_post(true);
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
        $form.find(".tc-save-draft").click(function(e) {
            parse_post(true);
            save_draft(current_post);
            build_drafts();
            $(this).addClass("tc-disabled");
            $(this).next().removeClass("tc-disabled");
            e.preventDefault();
        });
        $form.find(".tc-load-draft").click(function(e) {
            open_load_draft_form();
            e.preventDefault();
        });
        $form.find(".tc-load-draft-form .tc-load").click(function(e) {
            e.preventDefault();
            load_selected_draft();
        });
        $form.find(".tc-load-draft-form .tc-delete").click(function(e) {
            e.preventDefault();
            delete_selected_draft();
        });
        $form.find(".tc-clear-form").click(function(e) {
            clear_form();
            e.preventDefault();
        });

        // textarea auto-resize
        $form.find('textarea').each(function () {
            this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
        }).on('input', function () {
            resize_textarea(this);
            if ($(this).hasClass("tc-tag-helper-edit")) {
                resize_tag_helper();
            };
        });

        $tags = $(".tc-tag-selector");

        $form.find(".tc-tag-selector-input, .tc-preview-link-input, .tc-text, .tc-ps-text").change(function() {
            parse_post(true);
        });

        $form.find("input[type=text], textarea:not(.tc-tag-helper-edit)").focus(function(e) {
            check_tag_helper(this);
        });

        $form.find(".tc-tag-helper .tc-edit").click(function(e) {
            switch_tag_helper_edit(true);
        });

        $form.find(".tc-tag-helper .tc-accept").click(function(e) {
            switch_tag_helper_edit(false, true);
        });

        $form.find(".tc-tag-helper .tc-cancel").click(function(e) {
            switch_tag_helper_edit(false, false);
        });
    }

    function get_overlay_class() {
        return ".overlay-" + feature_name;
    }

    function switch_tag_helper_edit(enable, save = false) {
        $tag_helper_edit = $form.find(".tc-tag-helper-edit");
        if (enable) {
            $tag_helper_edit.removeClass("tc-disabled");
            $form.find(".tc-tag-helper .tc-accept").removeClass("tc-disabled");
            $form.find(".tc-tag-helper .tc-cancel").removeClass("tc-disabled");
            $form.find(".tc-tag-helper .tc-edit").addClass("tc-disabled");
            $form.find(".tc-tag-helper .tc-tag-view").addClass("tc-disabled");
            if (tag_selector_help != initial_tag_selector_help) {
                $tag_helper_edit.val(tag_selector_help.trim());
            } else {
                $tag_helper_edit.val("");
            }
            resize_textarea($tag_helper_edit[0]);
        } else {
            $tag_helper_edit.addClass("tc-disabled");
            $form.find(".tc-tag-helper .tc-accept").addClass("tc-disabled");
            $form.find(".tc-tag-helper .tc-cancel").addClass("tc-disabled");
            $form.find(".tc-tag-helper .tc-edit").removeClass("tc-disabled");
            $form.find(".tc-tag-helper .tc-tag-view").removeClass("tc-disabled");

            if (save) {
                tag_selector_help = $tag_helper_edit.val().trim();
                if (tag_selector_help == "")
                    tag_selector_help = initial_tag_selector_help;
                $.cookie(tag_save, JSON.stringify(tag_selector_help), { expires: cookie_lifetime });

                build_tag_help();
                refresh_tags_view();
            }
        }
        resize_tag_helper();        
    }

    function open_load_draft_form() {
        $(".tc-load-draft").addClass("tc-disabled");
        $(".tc-load-draft-form").removeClass("tc-disabled");
        $(".tc-draft-left a").addClass("tc-small");
        $(".tc-draft-right").addClass("tc-big");
    }

    function close_load_draft_form() {
        $(".tc-load-draft").removeClass("tc-disabled");
        $(".tc-load-draft-form").addClass("tc-disabled");
        $(".tc-draft-left a").removeClass("tc-small");
        $(".tc-draft-right").removeClass("tc-big");
    }

    function resize_textarea(target) {
        target.style.height = 'auto';
        newHeight = (target.scrollHeight) + 'px';
        target.style.height = newHeight;
    }

    function clear_form() {
        $form.find(".tc-text-wrapper textarea, input[type=text]").val("");
        $form.find(".tc-title-wrapper, .tc-bottom-link-wrapper").empty();
        resize_textarea($form.find(".tc-text-wrapper textarea")[0]);
        parse_post(true);
        refresh_tags_view();
        generate_preview();
    }

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
        $title_instance.find(".tc-title-input").focus(function() {
            check_tag_helper(this);
        });
        last_title_id += 1;
    }

    function set_title(id, title) {
        $title = $($titles[id]);
        $title.find(".tc-title-input").val(title);
    }

    function check_tag_helper(source) {
        if ($(source).hasClass("tc-tag-selector-input") ) {
            resize_tag_helper();
        } else {
            $form.find(".tc-tag-helper").css({
                height: 0,
                padding: 0
            });    
        }
    }

    function resize_tag_helper() {
        if ($form.find(".tc-tag-view").hasClass("tc-disabled")) {
            tag_helper_height = $form.find(".tc-tag-helper-edit").outerHeight();
        } else {
            tag_helper_height = $form.find(".tc-tag-view").outerHeight();
        }
        $form.find(".tc-tag-helper").css({
            height: tag_helper_height + 30,
            padding: "10px 0 20px"
        });
        $form.find(".tc-tag-helper")[0].scrollTop = 0;
    }

    function update_tags(tags) {
        tags.sort();
        tags_string = tags.join(" ");
        $form.find(".tc-tag-selector-input").val(tags_string);
        if ($tags_buttons == "")
            return;
        parse_post(true);
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

    function reset_save_draft_button() {
        $form.find(".tc-save-draft-complete").addClass("tc-disabled");
        $form.find(".tc-save-draft").removeClass("tc-disabled");
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
        $bottom_link_instance.find(".tc-bottom-link-input").focus(function() {
            check_tag_helper(this);
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
            post = copy_json(data);
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
            do_auto_save(post);
            on_data_changed();
            if (last_preview != preview) {
                generate_preview();
                last_preview = preview;
            }
        } else {
            post = "<p>" + post.trim().replace(/\n/g, "</p><p>") + "</p>";

            $message_box = $(".ql-editor");
            $message_box.html(post);
        }
    }

    function save_draft(post_data) {
        current_post = post_data;
        saved_drafts.push(current_post);
        $.cookie(drafts_save, JSON.stringify(saved_drafts), { expires: cookie_lifetime });
    }

    function load_selected_draft() {
        $selected_option = $form.find(".tc-draft-list option:selected");
        if (!$selected_option.length)
            return;
        
        selected_id = $selected_option.val();
        clear_form();
        current_post = saved_drafts[selected_id];
        build_form();
        build_drafts();
        $form.find(".tc-draft-list option:selected").removeAttr('selected');
        $form.find(".tc-draft-list option[value='" + selected_id + "']").attr('selected', true);
        add_handlers();
        open_load_draft_form();
        parse_post(true);
    }

    function delete_selected_draft() {
        $selected_option = $form.find(".tc-draft-list option:selected");
        if (!$selected_option.length)
            return;
        
        selected_id = $selected_option.val();
        saved_drafts.splice(selected_id, 1);
        $.cookie(drafts_save, JSON.stringify(saved_drafts), { expires: cookie_lifetime });
        build_drafts();
    }

    function do_auto_save(post_data) {
        if (auto_save_inactive)
            return;
        current_post = post_data;
        $.cookie(auto_save, JSON.stringify(current_post), { expires: cookie_lifetime });
    }

    function on_data_changed() {
        close_load_draft_form();
        reset_save_draft_button();
    }
    
    function copy_json(src) {
        return JSON.parse(JSON.stringify(src));
    }
});
