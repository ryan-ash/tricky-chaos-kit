var cookie_lifetime = 365 * 5;
var global_save = "trickychaos";
var auto_save = "tc-auto-save";
var drafts_save = "tc-drafts";
var tag_save = "tc-tag-helper";
var buttons_save = "tc-buttons";
var feature_name = "text-template";

var last_title_id = 0;
var last_bottom_link_id = 0;

var handlers_active = false;
var auto_save_inactive = false;
var tag_hotkeys = false;
var debug = false;

var post_textarea = "";

function save(name, value) {
    // check if primitive, stringify otherwise
    value_to_store = value;
    if (typeof value != "number" && typeof value != "boolean" && typeof value != "string" && value != null && value != undefined) {
        value_to_store = JSON.stringify(value);
    }
    $.cookie(name, value_to_store, { expires: cookie_lifetime });

    if (chrome && chrome.runtime) {
        if (debug)
            console.log("Saving cookie: " + name + " = " + value_to_store);
        chrome.runtime.sendMessage({event: "backup_cookie", name: name, value: value_to_store});
    }
}

function restore_cookies(callback) {
    processed_keys = [];
    function restore_backup() {
        // app should backup existing cookie states
        save_list = [global_save, auto_save, drafts_save, tag_save, buttons_save];
        for (var i in save_list) {
            key = save_list[i];
            if (!processed_keys.includes(key) && $.cookie(key)) {
                save(key, $.cookie(key));
            }
        }
    }
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage({event: "restore_cookie"}, function(response) {
            if (!response || !response.response) {
                restore_backup();
                callback();
                return;
            }
            if (debug)
                console.log("Restoring cookies...");

            for (var key in response.response) {
                value = response.response[key];
                if (debug)
                    console.log("Restoring cookie: " + key + " = " + value);
                if (typeof value == "string" && (value[0] == "{" || value[0] == "[")) {
                    value = JSON.parse(value);
                }
                save(key, value);
                processed_keys.push(key);
            }

            restore_backup();
            callback();
        });
    } else {
        callback();
    }
}

$(document).ready(function() {
    var $body = $("body");
    var $root = "";
    var $root_content = "";
    var $overlay = "";
    var $tags_buttons = "";
    var $form = "";
    var $titles_wrapper = "";
    var $titles = [];
    var $bottom_links_wrapper = "";
    var $bottom_links = [];
    var $preview_wrapper = "";

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
    var button_states = {};


    
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.text === 'toggle_display_mode') {
            toggle_display_mode();
        }
    });

    // === main ===

    restore_cookies(function() {
        if ($.cookie(global_save)) {
            enable();
        }    
    });
    
    $(document).keydown(function(e) {
        if (tag_hotkeys && (e.which >= 37 && e.which <= 40)) {
            handle_tag_hotkey(e.which > 38, e);
        }
        if (e.which != 113)
            return;
        toggle_display_mode();
    });



    // === functions ===

    function update_icon() {
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({event: "update_icon", active: $body.hasClass(feature_name)});
        }
    }

    function toggle_display_mode() {
        if ($body.hasClass(feature_name))
            disable();
        else
            enable();
    }

    function enable() {
        $root = $body.find(".wrap > .container");
        $root_content = $body.find(".wrap > .container > .content");
        if (!$root.length) {
            // retry init if no form is found on start
            setTimeout(function() {
                enable();
            }, 100);
            return;
        }

        // init start: add overlay base
        $root.prepend(overlay_markup);

        $root_content.append($body.find(".tc-copy"));

        // why do we touch footer?..
        $footer = $body.find("footer");
        $footer_name_span = $body.find("footer > span:first-child");
        $footer.css("max-width", $footer_name_span.width());

        $body.addClass(feature_name);
        save(global_save, true);

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

        if ($.cookie(tag_save) && $.cookie(tag_save) != "") {
            tag_selector_help = $.cookie(tag_save);
        }

        if ($.cookie(buttons_save)) {
            button_states = JSON.parse($.cookie(buttons_save));
        }

        build_form();
        build_drafts();
        setup_textarea();
        generate_link_preview();
        generate_options_button();
        add_handlers();
        toggle_reactions();
        toggle_url_buttons();
        parse_post();
        if (button_states["preview"]) {
            toggle_preview();
        }
        if (button_states["form"]) {
            toggle_form_fields();
        }
        if (button_states["drafts"]) {
            toggle_load_draft_form();
        }
        if (button_states["switches"]) {
            toggle_switches();
        }
        schedule_refresh_post();
        update_icon();
    }

    function disable() {
        $body.find(get_overlay_class()).remove();
        $body.find(".tc-link-preview").remove();
        $body.find(".tc-options-button").remove();
        $body.find(".tc-button").remove();
        $footer.css("max-width", "");
        $body.find(".tc-disabled").removeClass("tc-disabled");
        $body.find(".tc-hidden").removeClass("tc-hidden");
        $body.find(".tc-pushed-down").removeClass("tc-pushed-down");

        $body.removeClass(feature_name);
        save(global_save, null);

        handlers_active = false;
        update_icon();
    }

    function build_form() {
        auto_save_inactive = true;
        $overlay = $body.find(get_overlay_class());
        $form = $overlay.find(".tc-form");
        $form.html(form_content);
        $titles_wrapper = $form.find(".tc-title-wrapper");
        $bottom_links_wrapper = $form.find(".tc-bottom-link-wrapper");
        $preview_wrapper = $(".tc-preview-wrapper");

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
        $sibling = $root.find(".tc-preview");

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
        $options = $body.find(".post-form__bottom");
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
        $form.find(".tc-toggle-form").click(function(e) {
            toggle_form_fields();
            check_tag_helper(this);
            e.preventDefault();
        });
        $form.find(".tc-save-draft").click(function(e) {
            save_draft(current_post);
            build_drafts();
            $(".tc-save-draft").addClass("tc-disabled");
            $(".tc-save-draft-complete").removeClass("tc-disabled");
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
        $body.find(".tc-copy").click(function(e) {
            copy_post();
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
        $form.find(".tc-text-input").on('input', function() {
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

        $buttons_headers = $(".-paste");
        // $buttons_headers.unbind("click");

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

    function switch_tag_helper_edit(enable, save_after = false) {
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

            if (save_after) {
                tag_selector_help = $tag_helper_edit.val().trim();
                if (tag_selector_help == "")
                    tag_selector_help = initial_tag_selector_help;
                save(tag_save, tag_selector_help);

                build_tag_help();
                refresh_tags_view();
            }
        }
        resize_tag_helper();        
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
        $preview_wrapper.toggleClass("tc-collapsed");
        is_visible = !$preview_wrapper.hasClass("tc-collapsed");
        button_states["preview"] = is_visible;
        save_button_states();
        if (is_visible) {
            $(".tc-toggle-preview").addClass("tc-active");
        } else {
            $(".tc-toggle-preview").removeClass("tc-active");
        }
    }

    function toggle_form_fields() {
        $form_inputs = $(".tc-form-inputs");
        $form_inputs.toggleClass("tc-collapsed");
        is_visible = !$form_inputs.hasClass("tc-collapsed");
        button_states["form"] = is_visible;
        save_button_states();
        if (is_visible) {
            $(".tc-toggle-form").addClass("tc-active");
            $root_content.addClass("tc-collapsed");
        } else {
            $(".tc-toggle-form").removeClass("tc-active");
            $root_content.removeClass("tc-collapsed");
        }
        schedule_refresh_post();
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
        $switches = $(".post-form__bottom").toggleClass("tc-hidden");
        button_states["switches"] = $switches.hasClass("tc-hidden");
        save_button_states();
        $option_on = $(".tc-options-button .on").toggleClass("tc-disabled");
        $option_off = $(".tc-options-button .off").toggleClass("tc-disabled");
        // todo: change switches button
    }

    function toggle_load_draft_form() {
        $drafts = $(".tc-drafts");
        $drafts.toggleClass("tc-visible");
        is_visible = $drafts.hasClass("tc-visible");
        button_states["drafts"] = is_visible;
        save_button_states();
        $root.toggleClass("tc-pushed-down");
        $preview_wrapper.toggleClass("tc-pushed-down");

        // a temporary clutch
        if (is_visible) {
            setTimeout(function() {
                $drafts.css("overflow", "visible");
            }, 250);
            $(".tc-load-draft").addClass("tc-active");
        } else {
            $drafts.css("overflow", "hidden");
            $(".tc-load-draft").removeClass("tc-active");
        }
    }

    function save_button_states() {
        save(buttons_save, button_states);
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
            post_string += "> <i>" + ps + "</i>";
        }

        do_auto_save(post);
        on_data_changed();
        if (last_preview != preview) {
            generate_link_preview();
            last_preview = preview;
        }

        post_string = post_string.replace(/<strong>/g, "<b>").replace(/<\/strong>/g, "</b>").replace(/<em>/g, "<i>").replace(/<\/em>/g, "</i>").replace(/ rel="noopener noreferrer" target="_blank"/g, "");

        $preview_wrapper.css("height", "auto");

        post_preview = "<p>" + post_string.trim().replace(/\n/g, "</p><p>") + "</p>";
        post_preview = post_preview.replace(/<p><\/p>/g, "<p>&nbsp;</p>");
        $message_box = $(".tc-preview");
        $message_box.html(post_preview);

        $preview_wrapper.css("height", $preview_wrapper[0].scrollHeight);

        $textarea = $("#postform-text");
        if ($textarea.length) {
            $textarea.val(post_string);
            $textarea.css("height", "auto");
            $textarea.css("height", $textarea[0].scrollHeight);    
        }
    }

    function prepare_string(str) {
        return str.replace(/<\/p>/g, "\n").replace(/<p>/g, "").replace(/<br>/g, "").trim();
    }

    function save_draft(post_data) {
        current_post = post_data;
        saved_drafts.push(current_post);
        save(drafts_save, saved_drafts);
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

        $form.find(".tc-draft-list option:selected").removeAttr('selected');
        $form.find(".tc-draft-list option[value='" + selected_id + "']").attr('selected', true);

        parse_post();
        $root.toggleClass("tc-pushed-down");
        $preview_wrapper.toggleClass("tc-pushed-down");
        $root_content.removeClass("tc-collapsed");

        save_button_states();
        schedule_refresh_post();

        if (button_states["form"]) {
            toggle_form_fields();
        }
        button_states["drafts"] = false;
    }

    function delete_selected_draft() {
        $selected_option = $form.find(".tc-draft-list option:selected");
        if (!$selected_option.length)
            return;
        
        selected_id = $selected_option.val();
        saved_drafts.splice(selected_id, 1);
        save(drafts_save, saved_drafts);
        build_drafts();
    }

    function do_auto_save(post_data) {
        if (auto_save_inactive)
            return;
        current_post = post_data;
        save(auto_save, current_post);
    }

    function on_data_changed() {
        reset_save_draft_button();
    }
    
    function copy_json(src) {
        return JSON.parse(JSON.stringify(src));
    }

    function copy_post() {
        $textarea = $("#postform-text");
        $textarea.select();
        $textarea[0].setSelectionRange(0, 99999);

        navigator.clipboard.writeText($textarea.val());
    }

    function schedule_refresh_post() {
        setTimeout(function() {
            parse_post();
        }, 300);
    }

    // initial fade in

    $("html").addClass("tck-processed");
    setTimeout(function() {
        $("html").addClass("tck-loaded");
    }, 250);
});
