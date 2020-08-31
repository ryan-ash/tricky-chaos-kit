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
        <div class="button subtle hide-on-edit tc-solo-button tc-custom-button fa fa-play" href="#" style="margin: 0">&nbsp;</div>
        <div class="button subtle hide-on-edit tc-mute-button tc-custom-button fa fa-volume-off" href="#" style="margin: 0">&nbsp;</div>
    `
    var enabled = false;
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

        remove_checklist_controls();
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
        add_checklist_controls();

        $addon = $(".tc-add-checklist");
        if ($addon.length) {
            return;
        }

        add_checklist_maker();
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

    function add_checklist_maker() {
        $window_wrapper.append(add_checklist_markup);
        add_checklist_maker_event();
        hide_all_checked_items();
    }

    function add_checklist_controls() {
        if ($checklist_title.length != $(".tc-solo-button").length)
        {
            remove_checklist_controls();
            $checklist_title.append(checklist_buttons_markup);
            add_checklist_controls_events();
            $(".js-confirm-delete").addClass("fa").addClass("fa-trash-o");
            $(".js-show-checked-items").addClass("fa").addClass("fa-check-circle-o");
            $(".js-hide-checked-items").addClass("fa").addClass("fa-check-circle");
        }
    }

    function remove_checklist_controls() {
        $(".tc-add-checklist").remove().detach();
        $(".tc-custom-button").remove();
        $(".tc-hidden").removeClass("tc-hidden");
        $(".fa").removeClass("fa").removeClass("fa-trash-o").removeClass("fa-check-circle").removeClass("fa-check-circle-o");
    }

    function hide_all_checked_items() {
        $(".js-hide-checked-items").each(function() {
            $(this)[0].click();
        });
    }

    function add_checklist_maker_event() {
        $(".tc-add-checklist").click(function(e){
            e.preventDefault();
            $(".js-add-checklist-menu")[0].click();
            $(".pop-over").addClass("checklist");
            $("#id-checklist").val("to do");
            setTimeout(function() {
                check_overlay_shown();
            }, 200);
        });
    }

    function add_checklist_controls_events() {
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