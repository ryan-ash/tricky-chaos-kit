$(document).ready(function() {
    var $body = $("body");
    var $window_wrapper = undefined;
    var $checklist_title = undefined;

    var cookie_lifetime = 365 * 5;
    var save = "trickychaos";
    var feature_name = "trello-addons"
    var add_checklist_markup = `
        <a class="icon-lg tc-add-checklist" href="#"></a>
    `;
    var checklist_buttons_markup = `
        <div class="button subtle hide-on-edit tc-solo-button tc-custom-button" href="#" style="margin: 0">Solo</div>
        <div class="button subtle hide-on-edit tc-mute-button tc-custom-button" href="#" style="margin: 0">Mute</div>
    `
    var enabled = false;
    var checklist_count = 0;
    var check_delta = 333;
    var window_check = undefined;

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
        $body.addClass(feature_name);
        $.cookie(save, true, { expires: cookie_lifetime });

        check_window_addons();
    }

    function disable() {
        enabled = false;
        $body.removeClass(feature_name);
        $.cookie(save, null);
        clearTimeout(window_check);

        $(".tc-add-checklist").remove().detach();
        $(".tc-custom-button").remove();
    }

    function check_window_addons() {
        if (enabled) {
            window_check = setTimeout(function() {
                check_window_addons();
            }, check_delta);
        }

        $window_wrapper = $(".window-wrapper");
        $checklist_title = $(".checklist .window-module-title");
        if (!$window_wrapper.length) {
            return;
        }

        apply_checklist_lightup();

        $addon = $(".tc-add-checklist");
        if ($addon.length) {
            return;
        }

        apply_windows_addons();
    }
    
    function apply_checklist_lightup() {
        $checklist_items = $(".checklist-item");
        $checklist_items.each(function() {
            $this = $(this);
            $input = $this.find(".edit textarea");

            item = $this.find(".checklist-item-details-text").text();
            input_item = $input.val();

            compare_item = item;
            if (input_item == "") {
                if ($this.hasClass("tc-checked")) {
                    return;
                }
            } else {
                $this.removeClass("tc-checked");
                if (input_item != item) {
                    compare_item = input_item;
                }
            }
            if (compare_item == undefined) {
                return;
            }

            $this.addClass("tc-checked");
            compare_item = compare_item.replace(/\./g, "");

            mark = compare_item[compare_item.length-1];
            switch(mark) {
                case "!":
                    $this.addClass("tc-important");
                    break;
                case "?":
                    $this.addClass("tc-unsure");
                    break;
                default:
                    $this.removeClass("tc-important");
                    $this.removeClass("tc-unsure");
                    break;
            }
        });
    }

    function apply_windows_addons() {
        $window_wrapper.append(add_checklist_markup);
        $checklist_title.append(checklist_buttons_markup);
        add_button_events();
        hide_all_checked_items();
    }

    function hide_all_checked_items() {
        $(".js-hide-checked-items").each(function() {
            $(this)[0].click();
        });
    }

    function add_button_events() {
        $(".tc-add-checklist").click(function(e){
            e.preventDefault();
            $(".js-add-checklist-menu")[0].click();
            $(".pop-over").addClass("checklist");
            $("#id-checklist").val("to do");
            setTimeout(function() {
                check_overlay_shown();
            }, 200);
        });
        $(".tc-solo-button").click(function(e){
            e.preventDefault();
            $(this).toggleClass("tc-option-active");
            $parent = $(this).parent().parent();
            $target = $(".checklist").not($parent);
            $target.toggleClass("tc-hidden");
        });
        $(".tc-mute-button").click(function(e){
            e.preventDefault();
            $(this).toggleClass("tc-option-active");
            $parent = $(this).parent().parent();
            $target = $parent.find(".checklist-items-list, .checklist-progress, .checklist-new-item");
            $target.toggleClass("tc-hidden");
        });
    }

    function check_overlay_shown() {
        if ($(".pop-over").hasClass("is-shown")) {
            setTimeout(function() {
                check_overlay_shown();
            }, 100);
            return;
        }
        $(".pop-over").removeClass("checklist");
    }
});