$(document).ready(function() {
    var $body = $("body");
    var $root = "";
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
    var tag_hotkeys = false;

    var post_textarea = "";

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


    
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.text === 'toggle_display_mode') {
            toggle_display_mode();
        }
    });

    // === main ===

    if ($.cookie(save)) {
        enable();
    }

    $(document).keydown(function(e) {
        if (tag_hotkeys && (e.which >= 37 && e.which <= 40)) {
            handle_tag_hotkey(e.which > 38, e);
        }
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
        $root = $body.find(".el-form");
        if (!$root.length) {
            setTimeout(function() {
                enable();
            }, 100);
            return;
        }
        $root.prepend(overlay_markup);

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
        setup_textarea();
        generate_link_preview();
        generate_options_button();
        add_handlers();
        toggle_preview();
        toggle_reactions();
        toggle_url_buttons();
        toggle_switches();
    }

    function disable() {
        $body.find(get_overlay_class()).remove();
        $body.find(".tc-link-preview").remove();
        $body.find(".tc-options-button").remove();
        $footer.css("max-width", "");
        $body.find(".tc-disabled").removeClass("tc-disabled");
        $body.find(".tc-hidden").removeClass("tc-hidden");

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
        parse_post();
    }

    function build_tag_help() {
        $tag_helper = $form.find(".tc-tag-helper");
        $tag_view = $form.find(".tc-tag-view");
        $tag_helper_edit = $form.find(".tc-tag-helper-edit");

        tag_filter = /#[0-9a-zA-Z_]+/g;
        tag_selector_help_html = tag_selector_help.trim().split("\n").join("<br />");
        tag_selector_help_html = tag_selector_help_html.replace(tag_filter, "<div class='tc-tag tc-dynamic-width'>$&</div>")

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

    function setup_textarea() {
        var toolbarOptions = ['bold', 'italic', 'link', 'code'];
        post_textarea = new Quill('#tc-text', {
            formats: toolbarOptions,
            modules: {
                toolbar: toolbarOptions
            },
            theme: 'bubble',
            placeholder: 'Text...',
            clipboard: {
                matchVisual: false
            }
        });
        delete post_textarea.getModule('keyboard').bindings["9"];
        update_text(current_post.text);
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
        default_draft_option = "<option value='no'>[no drafts]</option>";
        for (var i in saved_drafts) {
            draft = saved_drafts[i];
            title_amount = draft.titles.length;
            draft_name = title_amount > 0 ? draft.titles[title_amount-1] : draft.text.substring(0, 30) + "...";
            draft_option = "<option value='" + i + "'>" + i + ": " + draft_name + "</option>";
            $(draft_option).val(i);
            $select.append(draft_option);
        }
        if (saved_drafts.length == 0) {
            $select.append(default_draft_option);
        }
    }

    function generate_link_preview() {
        embed_link = get_embed_link(current_post.preview_link);
        $sibling = $root.find(".cb-textarea-wrapper");

        $root.find('.tc-link-preview').remove();
        $root.append(link_preview_markup);

        $instance = $root.find(".tc-link-preview");
        $instance.insertAfter($sibling);

        if (embed_link == "") {
            $instance.addClass("tc-disabled");
        } else {
            $instance.removeClass("tc-disabled");
        }

        $iframe_instance = $root.find(".tc-link-preview iframe");
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

    function generate_options_button() {
        $options = $body.find(".cb-newpost-options .cb-switchers");
        $root.append(options_button_markup);

        $instance = $body.find(".tc-options-button");
        $instance.insertBefore($options);
    }

    function add_handlers() {
        handlers_active = true;

        $form.find(".tc-button, .tc-tag").keypress(function(e) {
            if (e.which == 13 || e.which == 32) {
                $(this).click();
            }
        });

        $form.find(".tc-add-title").click(function(e) {
            add_title();
            check_tag_helper(this);
            e.preventDefault();
        });
        $form.find(".tc-tag-selector .tc-reset").click(function(e) {
            $form.find(".tc-tag-selector-input").val("");
            update_tags([]);
            refresh_tags_view();
            parse_post();
            e.preventDefault();
        });
        $form.find(".tc-preview-link .tc-reset").click(function(e) {
            $form.find(".tc-preview-link-input").val("");
            parse_post();
            check_tag_helper(this);
            e.preventDefault();
        });
        $form.find(".tc-ps-text .tc-reset").click(function(e) {
            $form.find(".tc-ps-text-input").val("");
            parse_post();
            check_tag_helper(this);
            e.preventDefault();
        });
        $form.find(".tc-text-wrapper .tc-reset").click(function(e) {
            update_text("");
            parse_post();
            check_tag_helper(this);
            e.preventDefault();
        });
        $form.find(".tc-add-bottom-link").click(function(e) {
            add_bottom_link();
            check_tag_helper(this);
            e.preventDefault();
        });

        $form.find(".tc-toggle-preview").click(function(e) {
            toggle_preview();
            check_tag_helper(this);
            e.preventDefault();
        });
        $form.find(".tc-save-draft").click(function(e) {
            save_draft(current_post);
            build_drafts();
            $(this).addClass("tc-disabled");
            $(this).next().removeClass("tc-disabled");
            check_tag_helper(this);
            e.preventDefault();
        });
        $form.find(".tc-load-draft").click(function(e) {
            toggle_load_draft_form();
            check_tag_helper(this);
            e.preventDefault();
        });
        $form.find(".tc-drafts .tc-load").click(function(e) {
            e.preventDefault();
            check_tag_helper(this);
            load_selected_draft();
        });
        $form.find(".tc-drafts .tc-delete").click(function(e) {
            e.preventDefault();
            check_tag_helper(this);
            delete_selected_draft();
        });
        $form.find(".tc-clear-form").click(function(e) {
            clear_form();
            check_tag_helper(this);
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

        // autosave handling
        $form.find(".tc-text-input").change(function() {
            parse_post();
        });
        post_textarea.on('text-change', function(delta, oldDelta, source) {
            parse_post();
        });
        // autosave end

        $form.find(".tc-tag-selector-input").change(function() {
            refresh_tags_view();
        })

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

        $buttons_headers = $(".cb-buttons > .form-item-like .label");
        $buttons_headers.unbind("click");
        $reactions_button = $($buttons_headers[0]);
        $urls_button = $($buttons_headers[1]);

        $reactions_button.click(function(e) {
            toggle_reactions();
        });
        $urls_button.click(function(e) {
            toggle_url_buttons();
        });

        $body.find(".tc-options-button").unbind("click");
        $body.find(".tc-options-button").click(function(e) {
            toggle_switches();
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

    function toggle_load_draft_form() {
        $(".tc-drafts").toggleClass("tc-visible");

        // a temporary clutch
        if ($(".tc-drafts").hasClass("tc-visible")) {
            setTimeout(function() {
                $(".tc-drafts").css("overflow", "visible");
            }, 250);
            $(".tc-load-draft").addClass("tc-active");
        } else {
            $(".tc-drafts").css("overflow", "hidden");
            $(".tc-load-draft").removeClass("tc-active");
        }
    }

    function resize_textarea(target) {
        target.style.height = 'auto';
        newHeight = (target.scrollHeight) + 'px';
        target.style.height = newHeight;
    }

    function clear_form() {
        $form.find("input[type=text]").val("");
        $form.find(".tc-title-wrapper, .tc-bottom-link-wrapper").empty();
        update_text("");
        parse_post();
        refresh_tags_view();
        generate_link_preview();
    }

    function add_title() {
        $titles_wrapper.append(title_markup);
        $titles = $titles_wrapper.find(".tc-title");
        $title_instance = $($titles[$titles.length-1]);
        id = "tc-title-" + last_title_id;
        $title_instance.attr("id", id);

        $title_instance.find(".tc-remove, .tc-up, .tc-bottom").keypress(function(e) {
            if (e.which == 13 || e.which == 32) {
                $(this).click();
            }
        })
        $title_instance.find(".tc-remove").click(function(e) {
            $(this).parent().remove();
            check_tag_helper(this);
            parse_post();
        });
        $title_instance.find(".tc-up").click(function(e) {
            $this_title = $(this).parent();
            $other_title = $($this_title.prev());
            if (!$other_title.length) {
                $other_title = $this_title.siblings().last();
                if (!$other_title.length)
                    return;
            }
            this_content = $this_title.find(".tc-text-input").val();
            other_content = $other_title.find(".tc-text-input").val();
            $other_title.find(".tc-text-input").val(this_content);
            $this_title.find(".tc-text-input").val(other_content);

            check_tag_helper(this);
            parse_post();
        });
        $title_instance.find(".tc-bottom").click(function(e) {
            $this_title = $(this).parent();
            $other_title = $($this_title.next());
            if (!$other_title.length) {
                $other_title = $this_title.siblings().first();
                if (!$other_title.length)
                    return;
            }
            this_content = $this_title.find(".tc-text-input").val();
            other_content = $other_title.find(".tc-text-input").val();
            $other_title.find(".tc-text-input").val(this_content);
            $this_title.find(".tc-text-input").val(other_content);

            check_tag_helper(this);
            parse_post();
        });
        $title_instance.find(".tc-title-input").change(function() {
            parse_post();
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
            enable_tag_hotkeys();
            $form.find(".tc-tag-helper .tc-button").attr("tabindex", 0);
            setTimeout(function() {
                $(".tc-tag-helper").css("overflow", "visible");
            }, 250);
        } else {
            $form.find(".tc-tag-helper").css({
                height: 0,
                padding: 0
            });
            disable_tag_hotkeys();
            $form.find(".tc-tag-helper .tc-button").attr("tabindex", "");
            $(".tc-tag-helper").css("overflow", "hidden");
        }
    }

    function enable_tag_hotkeys() {
        tag_hotkeys = true;
    }

    function disable_tag_hotkeys() {
        tag_hotkeys = false;
        clear_current_tag_focus();
    }

    function handle_tag_hotkey(next, event) {
        $current_focus = $(':focus');
        first_tag_selector = ".tc-tag-selector .tc-tag-view .tc-tag:first-of-type";
        last_tag_selector = ".tc-tag-selector .tc-tag-view .tc-tag:last-of-type";
        $next_target = "";
        if ($current_focus.hasClass("tc-tag-selector-input") || $current_focus.hasClass("tc-button")) {
            if (next) {
                $next_target = $form.find(first_tag_selector);
            } else {
                $next_target = $form.find(last_tag_selector);
            }
        } else if ($current_focus.hasClass("tc-tag")) {
            if (next) {
                $all_next = $current_focus.nextAll(".tc-tag");
                if ($all_next.length) {
                    $next_target = $($all_next[0]);
                } else {
                    $next_target = $form.find(first_tag_selector);
                }
            } else {
                $all_prev = $current_focus.prevAll(".tc-tag");
                if ($all_prev.length) {
                    $next_target = $($all_prev[0]);
                } else {
                    $next_target = $form.find(last_tag_selector);
                }
            }
        }

        if ($next_target != "" && $next_target.length) {
            clear_current_tag_focus();
            $next_target.attr("tabindex", 0);
            $next_target.focus();
            event.preventDefault();
        }
    }

    function clear_current_tag_focus() {
        $form.find(".tc-tag-view .tc-tag[tabindex=0]").attr("tabindex", "");
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

    function toggle_preview() {
        $post = $(".cb-textarea-wrapper");
        $post.toggleClass("tc-disabled");
        if ($post.hasClass("tc-disabled")) {
            $(".tc-toggle-preview").removeClass("tc-active");
            $(".tc-form-inputs").removeClass("tc-disabled");
        } else {
            $(".tc-toggle-preview").addClass("tc-active");
            $(".tc-form-inputs").addClass("tc-disabled");
        }
    }

    function toggle_reactions() {
        $reactions = $($(".cb-buttons > .form-item-like .keyboard")[0]);
        $reactions.toggleClass("tc-disabled");
        // todo: change reactions button
    }

    function toggle_url_buttons() {
        $reactions = $($(".cb-buttons > .form-item-like .keyboard")[1]);
        $reactions.toggleClass("tc-disabled");
        // todo: change urls button
    }

    function toggle_switches() {
        $switchers = $(".cb-switchers").toggleClass("tc-hidden");
        $option_on = $(".tc-options-button .on").toggleClass("tc-disabled");
        $option_off = $(".tc-options-button .off").toggleClass("tc-disabled");
        // todo: change switches button
    }

    function update_tags(tags) {
        tags.sort();
        tags_string = tags.join(" ");
        $form.find(".tc-tag-selector-input").val(tags_string);
        if ($tags_buttons == "")
            return;
        parse_post();
    }

    function update_preview_link(link) {
        $form.find(".tc-preview-link-input").val(link);
    }

    function update_text(text) {
        if (text.trim() == "") {
            text = "\n";
        }
        $editor = $form.find(".tc-text .ql-editor");
        if (!$editor.length)
            return;
        text = "<p>" + text.trim().replace(/\n/g, "</p><p>") + "</p>";
        $editor.html(text);
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

        $bottom_link_instance.find(".tc-remove, .tc-up, .tc-bottom").keypress(function(e) {
            if (e.which == 13 || e.which == 32) {
                $(this).click();
            }
        });
        $bottom_link_instance.find(".tc-remove").click(function(e){
            $(this).parent().remove();
            check_tag_helper(this);
            parse_post();
        });
        $bottom_link_instance.find(".tc-up").click(function(e){
            $this_link = $(this).parent();
            $other_link = $($this_link.prev());
            if (!$other_link.length) {
                $other_link = $this_link.siblings().last();
                if (!$other_link.length)
                    return;
            }
            this_url = $this_link.find(".tc-link").val();
            this_text = $this_link.find(".tc-link-text").val();
            other_url = $other_link.find(".tc-link").val();
            other_text = $other_link.find(".tc-link-text").val();
            $other_link.find(".tc-link").val(this_url);
            $other_link.find(".tc-link-text").val(this_text);
            $this_link.find(".tc-link").val(other_url);
            $this_link.find(".tc-link-text").val(other_text);

            check_tag_helper(this);
            parse_post();
        });
        $bottom_link_instance.find(".tc-bottom").click(function(e){
            $this_link = $(this).parent();
            $other_link = $($this_link.next());
            if (!$other_link.length) {
                $other_link = $this_link.siblings().first();
                if (!$other_link.length)
                    return;
            }
            this_url = $this_link.find(".tc-link").val();
            this_text = $this_link.find(".tc-link-text").val();
            other_url = $other_link.find(".tc-link").val();
            other_text = $other_link.find(".tc-link-text").val();
            $other_link.find(".tc-link").val(this_url);
            $other_link.find(".tc-link-text").val(this_text);
            $this_link.find(".tc-link").val(other_url);
            $this_link.find(".tc-link-text").val(other_text);

            check_tag_helper(this);
            parse_post();
        });
        $bottom_link_instance.find(".tc-bottom-link-input").change(function() {
            parse_post();
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

    function parse_post() {
        if (!handlers_active)
            return;
        post = copy_json(data);
        post_string = "";
        
        $titles = $titles_wrapper.find(".tc-title");
        $tags = $form.find(".tc-tag-selector-input");
        $preview = $form.find(".tc-preview-link-input");
        $text = $form.find(".tc-text .ql-editor");
        $bottom_links = $bottom_links_wrapper.find(".tc-bottom-link");
        $ps = $form.find(".tc-ps-text-input");

        tags = $tags.val().trim();
        preview = $preview.val().trim();
        text = prepare_string($text.html());
        ps = prepare_string($ps.val());

        title_present = false;
        tags_present = tags != "";
        preview_present = preview != "";
        text_present = text != "";
        ps_present = ps != "";

        $.each($titles, function(index, value) {
            $title = $(value).find(".tc-title-input");
            title = prepare_string($title.val());
            if (title == "")
                return;
                
            title_present = true;
            post.titles.push(title);

            post_string += "[<b>" + title + "</b>]\n";
        });
        
        if (tags_present) {
            post.tags = tags.split(" ");
            post_string += "[" + tags + "]";
        }

        if (preview_present) {
            post.preview_link = preview;

            preview_link_string = "<a href=\"" + preview + "\">&#8291;</a>";
            post_string += preview_link_string;
        }

        if (tags_present) {
            post_string += "\n";
        }

        if (text_present) {
            post.text = text;

            if (title_present || tags_present) {
                post_string += "\n";
            }
            post_string += text;
        }

        $.each($bottom_links, function(index, value) {
            $link = $(value);
            link_url = $link.find(".tc-link").val().trim();
            link_text = prepare_string($link.find(".tc-link-text").val());
            if (link_url == "" && link_text == "")
                return;
                
            post.bottom_links.push({link: link_url, text: link_text});

            if (index == 0) {
                post_string += "\n\n";
            } else if (index > 0) {
                post_string += " | ";
            }
            post_string += "<a href=\"" + link_url + "\">" + link_text + "</a>";
        });

        if (ps_present) {
            post.ps = ps;

            post_string += "\n\n";
            post_string += "&gt; <code>" + ps + "</code>";
        }

        do_auto_save(post);
        on_data_changed();
        if (last_preview != preview) {
            generate_link_preview();
            last_preview = preview;
        }

        post_string = "<p>" + post_string.trim().replace(/\n/g, "</p><p>") + "</p>";
        $message_box = $(".el-form .quill-editor .ql-editor");
        $message_box.html(post_string);
    }

    function prepare_string(str) {
        return str.replace(/<\/p>/g, "\n").replace(/<p>/g, "").replace(/<br>/g, "").trim();
    }

    function save_draft(post_data) {
        current_post = post_data;
        saved_drafts.push(current_post);
        $.cookie(drafts_save, JSON.stringify(saved_drafts), { expires: cookie_lifetime });
    }

    function load_selected_draft() {
        $selected_option = $form.find(".tc-draft-list option:selected");
        if (!$selected_option.length || $selected_option.val() == "no")
            return;
        
        selected_id = $selected_option.val();
        current_post = saved_drafts[selected_id];
        handlers_active = false;

        clear_form();
        build_form();
        setup_textarea();
        build_drafts();
        add_handlers();

        $(".cb-textarea-wrapper").addClass("tc-disabled");
        $form.find(".tc-draft-list option:selected").removeAttr('selected');
        $form.find(".tc-draft-list option[value='" + selected_id + "']").attr('selected', true);

        parse_post();
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
        reset_save_draft_button();
    }
    
    function copy_json(src) {
        return JSON.parse(JSON.stringify(src));
    }
});
